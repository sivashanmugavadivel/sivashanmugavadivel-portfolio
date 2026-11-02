import { useGeolocation, useToast } from '../hooks';
import TopBar from './TopBar';
import ProfileHeader from './ProfileHeader';
import EmergencyActions from './EmergencyActions';
import MedicalInfo from './MedicalInfo';
import EmergencyContacts from './EmergencyContacts';
import NearbyHelp, { NearbyFallback } from './NearbyHelp';
import FirstAid from './FirstAid';
import VehicleInfo from './VehicleInfo';
import AboutMe from './AboutMe';
import CallBar from './CallBar';
import SectionBoundary from './SectionBoundary';

/**
 * The whole page for one profile. Responders get role="viewer" with onLock. The owner side
 * (account chunk) uses role="owner" with title, onEdit, onSignOut and `actions` for the top-bar
 * menu, or role="viewer" with onBack for its preview; `banner` is a note above the profile.
 */
export default function EmergencyView({ data, role, title, onLock, onBack, onEdit, onSignOut, actions, banner }) {
  const geo = useGeolocation(true);
  const [toastMessage, toast] = useToast();
  const emergencyNumber = data.services?.find((s) => s.number)?.number || '112';

  return (
    <div className="em-view">
      <TopBar
        name={data.profile?.name}
        role={role}
        title={title}
        onLock={onLock}
        onBack={onBack}
        onEdit={onEdit}
        onSignOut={onSignOut}
        actions={actions}
      />
      <main className="em-main">
        {banner && <div className="em-banner">{banner}</div>}
        <SectionBoundary>
          <ProfileHeader profile={data.profile} medical={data.medical} />
        </SectionBoundary>
        <SectionBoundary>
          <EmergencyActions data={data} geo={geo} toast={toast} />
        </SectionBoundary>
        <SectionBoundary>
          <MedicalInfo medical={data.medical} profile={data.profile} />
        </SectionBoundary>
        <SectionBoundary>
          <EmergencyContacts contacts={data.contacts} name={data.profile?.name} coords={geo.coords} />
        </SectionBoundary>
        <SectionBoundary fallback={<NearbyFallback coords={geo.coords} />}>
          <NearbyHelp geo={geo} fallbackCenter={data.map} />
        </SectionBoundary>
        <SectionBoundary>
          <FirstAid emergencyNumber={emergencyNumber} />
        </SectionBoundary>
        <SectionBoundary>
          <VehicleInfo vehicles={data.vehicles} />
        </SectionBoundary>
        <SectionBoundary>
          <AboutMe about={data.about} name={data.profile?.name} updatedAt={data.updatedAt} />
        </SectionBoundary>
      </main>
      <CallBar services={data.services} contacts={data.contacts} />
      <div className={`em-toast${toastMessage ? ' is-visible' : ''}`} role="status" aria-live="polite">
        {toastMessage}
      </div>
    </div>
  );
}
