import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LoaderCircle, LocateFixed, MapPinned, Navigation, Phone, RefreshCw, Search, X } from 'lucide-react';
import Section from './Section';
import { GOOGLE_MAP_ID, GOOGLE_MAPS_KEY } from '../config';
import { DEMO_MODE } from '../firebase';
import { usePrefersReducedMotion } from '../hooks';
import { fetchNearby, loadGoogleMaps, onGoogleAuthFailure, PLACE_ORDER, PLACE_TYPES } from '../nearby';
import { directionsUrl, distanceKm, formatDistance, mapsNearbyUrl, telHref } from '../utils';

const RADII_KM = [2, 5, 10];
const REFETCH_AFTER_KM = 1;
const LIST_LIMIT = 40;
const INDIA = { lat: 20.5937, lng: 78.9629 };

const GLYPHS = {
  hospital: '<b>H</b>',
  pharmacy: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" fill="currentColor"/></svg>',
  fire_station:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c.6 3.2 4.8 5.6 4.8 10.4a4.8 4.8 0 0 1-9.6 0c0-2.3 1.2-3.7 2.3-4.6-.1 1.7.6 3 1.8 3.2C11 8.6 11 5.2 12 2z" fill="currentColor"/></svg>',
  police:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4 5v6.2c0 5 3.4 9.3 8 10.8 4.6-1.5 8-5.8 8-10.8V5z" fill="currentColor"/></svg>',
};

/** Google's advanced markers take a DOM node, not an icon. */
function markerNode(html) {
  const wrap = document.createElement('div');
  wrap.innerHTML = html;
  return wrap.firstElementChild;
}

/** True while the point sits in the middle half of what the map shows. */
function wellInside(map, { lat, lng }) {
  const bounds = map.getBounds();
  if (!bounds) return true;
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  const padLat = (ne.lat() - sw.lat()) / 4;
  const padLng = (ne.lng() - sw.lng()) / 4;
  return lat > sw.lat() + padLat && lat < ne.lat() - padLat && lng > sw.lng() + padLng && lng < ne.lng() - padLng;
}

/** Section 5: live Google map with hospitals, pharmacies, fire and police stations nearby. */
export default function NearbyHelp({ geo, fallbackCenter }) {
  const mapNode = useRef(null);
  const gmaps = useRef(null);
  const layers = useRef({});
  const markers = useRef(new Map());
  const lastFetch = useRef(null);
  const requestId = useRef(0);
  const follow = useRef(true);

  // 'off' = no API key, 'loading', 'ready', 'failed' = Google refused the key or didn't load.
  const [mapState, setMapState] = useState(GOOGLE_MAPS_KEY ? 'loading' : 'off');
  const [places, setPlaces] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('distance');
  const [radius, setRadius] = useState(5);
  const [areaCenter, setAreaCenter] = useState(null);
  const [mapMoved, setMapMoved] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const reducedMotion = usePrefersReducedMotion();
  const me = geo.coords;
  const fetchCenter = areaCenter || me;
  const origin = me || fetchCenter;
  const live = mapState === 'loading' || mapState === 'ready';
  // The owner's "Map area": a cleared latitude or longitude is saved as null, which would centre the map in the sea.
  const homeArea =
    Number.isFinite(fallbackCenter?.lat) && Number.isFinite(fallbackCenter?.lng) ? fallbackCenter : null;

  // Create the map once.
  useEffect(() => {
    if (!GOOGLE_MAPS_KEY) return undefined;
    let cancelled = false;
    let refused = false;
    const listeners = [];
    const stopAuth = onGoogleAuthFailure(() => {
      // Google has torn the map down; anything that still calls it (the location dot) throws.
      refused = true;
      gmaps.current = null;
      layers.current = {};
      setMapState('failed');
    });
    Promise.all([loadGoogleMaps('maps'), loadGoogleMaps('marker'), loadGoogleMaps('core')])
      .then(([{ Map, Circle }, { AdvancedMarkerElement }, { ColorScheme, ControlPosition, LatLngBounds }]) => {
        // Google can refuse the key while the libraries load. A map built after that has no box
        // to draw in, its listeners come back undefined (so the cleanup below would throw and
        // take the page with it), and 'ready' would hide the refusal.
        if (cancelled || refused || !mapNode.current) return;
        const start = me || homeArea || INDIA;
        const map = new Map(mapNode.current, {
          center: { lat: start.lat, lng: start.lng },
          zoom: me ? 15 : 13,
          mapId: GOOGLE_MAP_ID,
          colorScheme: ColorScheme.FOLLOW_SYSTEM, // the phone's light/dark setting
          gestureHandling: 'cooperative', // one finger scrolls the page, two move the map
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: { position: ControlPosition.RIGHT_TOP },
        });
        listeners.push(
          map.addListener('dragstart', () => {
            follow.current = false;
            setMapMoved(true);
          }),
        );
        gmaps.current = { map, Marker: AdvancedMarkerElement, Circle, LatLngBounds };
        setMapState('ready');
      })
      .catch((err) => {
        console.error('Google Maps didn’t load', err);
        if (!cancelled) setMapState('failed');
      });
    return () => {
      cancelled = true;
      stopAuth();
      listeners.forEach((l) => l.remove());
      if (layers.current.me) layers.current.me.map = null;
      layers.current.accuracy?.setMap(null);
      layers.current = {};
      gmaps.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live "you are here" marker.
  useEffect(() => {
    const g = gmaps.current;
    if (!g || !me) return;
    const position = { lat: me.lat, lng: me.lng };
    if (!layers.current.me) {
      layers.current.accuracy = new g.Circle({
        map: g.map,
        center: position,
        radius: me.accuracy || 30,
        strokeColor: '#2B7FD4',
        strokeWeight: 1,
        fillColor: '#2B7FD4',
        fillOpacity: 0.12,
        clickable: false,
      });
      layers.current.me = new g.Marker({ map: g.map, position, content: markerNode('<span class="em-me"></span>'), zIndex: 1000 });
      if (follow.current) {
        g.map.setCenter(position);
        g.map.setZoom(15);
      }
    } else {
      layers.current.me.position = position;
      layers.current.accuracy.setCenter(position);
      layers.current.accuracy.setRadius(me.accuracy || 30);
      // Only re-centre when the dot drifts toward the edge, so the map doesn't jitter.
      if (follow.current && !wellInside(g.map, position)) {
        if (reducedMotion) g.map.setCenter(position);
        else g.map.panTo(position);
      }
    }
  }, [me, mapState, reducedMotion]);

  const load = useCallback(async (center, km, { frame = false } = {}) => {
    const id = ++requestId.current;
    lastFetch.current = { center, radius: km };
    setStatus('loading');
    setError('');
    try {
      const found = await fetchNearby(center, km * 1000);
      if (id !== requestId.current) return;
      setPlaces(found);
      setStatus('done');
      // Frame the user and the closest few results.
      const g = gmaps.current;
      if (g && frame && found.length) {
        const nearest = [...found].sort((a, b) => distanceKm(center, a) - distanceKm(center, b)).slice(0, 6);
        const bounds = new g.LatLngBounds();
        [center, ...nearest].forEach(({ lat, lng }) => bounds.extend({ lat, lng }));
        g.map.fitBounds(bounds, 40);
        // fitBounds has no zoom limit: one result next door would land on a single building.
        const settled = g.map.addListener('idle', () => {
          settled.remove();
          if (g.map.getZoom() > 16) g.map.setZoom(16);
        });
      }
    } catch (e) {
      if (id !== requestId.current) return;
      setError(e.message);
      setStatus('error');
    }
  }, []);

  // Fetch on first fix, after moving more than 1 km, or when the radius changes.
  useEffect(() => {
    if (!live || !fetchCenter) return;
    const last = lastFetch.current;
    if (!last || last.radius !== radius || distanceKm(last.center, fetchCenter) > REFETCH_AFTER_KM) {
      load(fetchCenter, radius, { frame: follow.current || Boolean(areaCenter) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchCenter, radius, load, live]);

  // Draw markers for the selected category.
  useEffect(() => {
    const g = gmaps.current;
    if (!g) return undefined;
    const shown = new Map();
    places
      .filter((p) => filter === 'all' || p.type === filter)
      .forEach((p) => {
        const marker = new g.Marker({
          map: g.map,
          position: { lat: p.lat, lng: p.lng },
          content: markerNode(`<span class="em-pin em-pin--${p.type}">${GLYPHS[p.type]}</span>`),
          title: p.name,
          gmpClickable: true,
        });
        marker.addEventListener('gmp-click', () => setSelectedId(p.id));
        shown.set(p.id, marker);
      });
    markers.current = shown;
    return () =>
      shown.forEach((marker) => {
        marker.map = null;
      });
  }, [places, filter, mapState]);

  const counts = useMemo(
    () => places.reduce((acc, p) => ({ ...acc, [p.type]: (acc[p.type] || 0) + 1 }), {}),
    [places],
  );

  const list = useMemo(() => {
    const withDistance = places
      .filter((p) => filter === 'all' || p.type === filter)
      .map((p) => ({ ...p, distance: origin ? distanceKm(origin, p) : null }));
    return withDistance.sort(
      sortBy === 'name' ? (a, b) => a.name.localeCompare(b.name) : (a, b) => (a.distance ?? 0) - (b.distance ?? 0),
    );
  }, [places, filter, sortBy, origin]);

  const selected = useMemo(() => {
    const place = selectedId && places.find((p) => p.id === selectedId);
    return place ? { ...place, distance: origin ? distanceKm(origin, place) : null } : null;
  }, [selectedId, places, origin]);

  const focusPlace = (place) => {
    setSelectedId(place.id);
    const g = gmaps.current;
    if (!g) return;
    follow.current = false;
    setMapMoved(true);
    mapNode.current.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
    const position = { lat: place.lat, lng: place.lng };
    if (reducedMotion) g.map.setCenter(position);
    else g.map.panTo(position);
    g.map.setZoom(17);
  };

  const searchHere = () => {
    const c = gmaps.current.map.getCenter();
    const center = { lat: c.lat(), lng: c.lng() };
    follow.current = false;
    setMapMoved(false);
    setAreaCenter(center);
    load(center, radius, { frame: true });
  };

  const backToMe = () => {
    if (!me || !gmaps.current) return;
    follow.current = true;
    setMapMoved(false);
    setAreaCenter(null);
    gmaps.current.map.setCenter({ lat: me.lat, lng: me.lng });
    gmaps.current.map.setZoom(15);
  };

  const locationMessage =
    !me && (geo.status === 'denied' || geo.status === 'error' || geo.status === 'unsupported') ? geo.error : '';

  return (
    <Section
      id="em-nearby"
      title="Nearby help"
      icon={MapPinned}
      action={
        me ? (
          <span className="em-live">
            <span className="em-loc__dot is-live" aria-hidden="true" /> Live
          </span>
        ) : null
      }
    >
      {live && (
        <div className="em-map-wrap">
          <div ref={mapNode} className="em-map" role="region" aria-label="Map of nearby emergency services" />
          {mapMoved && (
            <button type="button" className="em-map__search" onClick={searchHere}>
              <Search aria-hidden="true" /> Search this area
            </button>
          )}
          {me && (
            <button type="button" className="em-map__locate" onClick={backToMe} aria-label="Back to my location">
              <LocateFixed aria-hidden="true" />
            </button>
          )}
          {selected && (
            <div className="em-map__card">
              <button type="button" className="em-map__card-close" onClick={() => setSelectedId(null)} aria-label="Close">
                <X aria-hidden="true" />
              </button>
              <strong>{selected.name}</strong>
              <span>
                {PLACE_TYPES[selected.type].one}
                {selected.distance != null ? `, ${formatDistance(selected.distance)} away` : ''}
              </span>
              {selected.address && <span className="em-map__card-address">{selected.address}</span>}
              <span className="em-map__card-links">
                {selected.phone && (
                  <a className="em-btn em-btn--solid" href={telHref(selected.phone)}>
                    <Phone aria-hidden="true" /> Call
                  </a>
                )}
                <a className="em-btn" href={directionsUrl(selected)} target="_blank" rel="noreferrer">
                  <Navigation aria-hidden="true" /> Directions
                </a>
              </span>
            </div>
          )}
        </div>
      )}

      {live && !me && homeArea?.label && (
        <p className="em-list-status">Showing the area around {homeArea.label} until your location is found.</p>
      )}

      {locationMessage && (
        <div className="em-inline-notice">
          <p>
            {locationMessage}
            {live ? ' You can also drag the map to a place and tap “Search this area”.' : ''}
          </p>
          <button type="button" className="em-btn" onClick={geo.retry}>
            Try again
          </button>
        </div>
      )}

      {live && (
        <>
          <div className="em-filter" role="group" aria-label="Show on map">
            <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
              All <span className="em-count">{places.length}</span>
            </button>
            {PLACE_ORDER.map((type) => (
              <button key={type} type="button" aria-pressed={filter === type} onClick={() => setFilter(type)}>
                <span className={`em-dot em-dot--${type}`} aria-hidden="true" />
                {PLACE_TYPES[type].label} <span className="em-count">{counts[type] || 0}</span>
              </button>
            ))}
          </div>

          <div className="em-listbar">
            <label>
              Sort
              <select className="em-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="distance">Nearest first</option>
                <option value="name">Name, A to Z</option>
              </select>
            </label>
            <label>
              Within
              <select className="em-select" value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
                {RADII_KM.map((km) => (
                  <option key={km} value={km}>
                    {km} km
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="em-btn em-btn--quiet"
              onClick={() => fetchCenter && load(fetchCenter, radius)}
              disabled={!fetchCenter || status === 'loading'}
            >
              <RefreshCw aria-hidden="true" className={status === 'loading' ? 'em-spin' : undefined} /> Refresh
            </button>
          </div>

          {status === 'loading' && places.length === 0 && (
            <p className="em-list-status">
              <LoaderCircle className="em-spin" aria-hidden="true" /> Looking for help nearby…
            </p>
          )}
          {status === 'error' && (
            <div className="em-inline-notice">
              <p>{error}</p>
              <button type="button" className="em-btn" onClick={() => fetchCenter && load(fetchCenter, radius)}>
                Try again
              </button>
            </div>
          )}
          {status === 'idle' && !fetchCenter && !locationMessage && (
            <p className="em-list-status">Waiting for your location…</p>
          )}
          {status === 'done' && list.length === 0 && (
            <p className="em-list-status">
              Nothing found within {radius} km. Try a wider distance{filter !== 'all' ? ' or show all types' : ''}.
            </p>
          )}

          {list.length > 0 && (
            <ol className="em-places">
              {list.slice(0, LIST_LIMIT).map((p) => (
                <li key={p.id} className="em-place">
                  <button type="button" className="em-place__main" onClick={() => focusPlace(p)}>
                    <span className={`em-dot em-dot--${p.type}`} aria-hidden="true" />
                    <span className="em-place__name">{p.name}</span>
                    <span className="em-place__meta">{PLACE_TYPES[p.type].one}</span>
                    <span className="em-place__dist">{formatDistance(p.distance)}</span>
                  </button>
                  <div className="em-place__actions">
                    {p.phone && (
                      <a className="em-icon-btn" href={telHref(p.phone)} aria-label={`Call ${p.name}`}>
                        <Phone aria-hidden="true" />
                      </a>
                    )}
                    <a
                      className="em-icon-btn"
                      href={directionsUrl(p)}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Directions to ${p.name}`}
                    >
                      <Navigation aria-hidden="true" />
                    </a>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </>
      )}

      <GoogleMapsLinks
        coords={areaCenter || me}
        title={
          mapState === 'failed'
            ? 'The map didn’t load. Search in Google Maps instead:'
            : live
              ? 'Or search in Google Maps'
              : 'Search for help in Google Maps'
        }
        // import.meta.env.DEV first, so production builds drop the demo hint altogether.
        hint={
          import.meta.env.DEV && DEMO_MODE && mapState === 'off'
            ? 'Add VITE_GOOGLE_MAPS_API_KEY to show the map and the list of places here.'
            : ''
        }
      />

      {live && (
        <p className="em-fineprint">
          Places come from Google Maps and can be incomplete or out of date.
          {list.length > LIST_LIMIT ? ` Showing the first ${LIST_LIMIT} of ${list.length}.` : ''}
        </p>
      )}
    </Section>
  );
}

/** Works with no key, no quota and no map: opens the search in Google Maps (the app, on a phone). */
function GoogleMapsLinks({ coords, title, hint }) {
  return (
    <div className="em-gmaps">
      <p className="em-gmaps__title">{title}</p>
      {hint && <p className="em-fineprint">{hint}</p>}
      <div className="em-gmaps__links">
        {PLACE_ORDER.map((type) => (
          <a key={type} className="em-btn" href={mapsNearbyUrl(PLACE_TYPES[type].label, coords)} target="_blank" rel="noreferrer">
            <span className={`em-dot em-dot--${type}`} aria-hidden="true" />
            {PLACE_TYPES[type].label}
          </a>
        ))}
      </div>
    </div>
  );
}

/** What the section becomes if it crashes: the links still work. */
export function NearbyFallback({ coords }) {
  return (
    <Section id="em-nearby" title="Nearby help" icon={MapPinned}>
      <GoogleMapsLinks coords={coords} title="The map stopped working. Search in Google Maps instead:" />
    </Section>
  );
}
