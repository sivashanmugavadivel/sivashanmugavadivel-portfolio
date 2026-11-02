import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react';
import { EDITOR_TABS } from '../editorSchema';

const clone = (v) => JSON.parse(JSON.stringify(v));
const WIDE_TYPES = ['textarea', 'group', 'list', 'strings'];

/** `title` names whose page this is when it isn't the signed-in member's own ("Editing Ravi’s page"). */
export default function OwnerEditor({ initial, isNew, title = 'Edit emergency info', onSave, onClose }) {
  const [draft, setDraft] = useState(() => clone(initial));
  const [tabId, setTabId] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(initial), [draft, initial]);
  const canSave = (dirty || isNew) && !saving;
  const tab = EDITOR_TABS.find((t) => t.id === tabId);
  const setSection = (path, value) => setDraft((d) => ({ ...d, [path]: value }));

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await onSave(draft);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  const close = () => {
    if (!dirty || window.confirm('Close without saving your changes?')) onClose();
  };

  return (
    <div className="em-editor">
      <header className="em-editor__top">
        <div>
          <h1>{title}</h1>
          <p>{isNew ? 'Not saved yet' : dirty ? 'Unsaved changes' : 'Everything is saved'}</p>
        </div>
        <div className="em-editor__actions">
          <button type="button" className="em-btn" onClick={close}>
            Close
          </button>
          <button type="button" className="em-btn em-btn--solid" onClick={save} disabled={!canSave}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </header>

      <nav className="em-tabs" role="tablist" aria-label="Sections to edit">
        {EDITOR_TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={t.id === tabId} onClick={() => setTabId(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      {error && (
        <p className="em-msg em-msg--error" role="alert">
          {error}
        </p>
      )}

      <div className="em-editor__body" role="tabpanel">
        {tab.hint && <p className="em-hint em-hint--lead">{tab.hint}</p>}
        {tab.kind === 'list' && (
          <ListEditor spec={tab} items={draft[tab.path] || []} onChange={(v) => setSection(tab.path, v)} idPrefix={tab.id} />
        )}
        {tab.kind === 'group' && (
          <GroupFields fields={tab.fields} value={draft[tab.path] || {}} onChange={(v) => setSection(tab.path, v)} idPrefix={tab.id} />
        )}
      </div>
    </div>
  );
}

function GroupFields({ fields, value, onChange, idPrefix }) {
  return (
    <div className="em-form-grid">
      {fields.map((f) => (
        <div key={f.key} className={f.wide || WIDE_TYPES.includes(f.type) ? 'em-span-2' : undefined}>
          <Field field={f} value={value[f.key]} onChange={(v) => onChange({ ...value, [f.key]: v })} id={`${idPrefix}-${f.key}`} />
          {f.hint && <p className="em-hint">{f.hint}</p>}
        </div>
      ))}
    </div>
  );
}

function Field({ field, value, onChange, id }) {
  switch (field.type) {
    case 'group':
      return (
        <fieldset className="em-fieldset">
          <legend>{field.label}</legend>
          <GroupFields fields={field.fields} value={value || {}} onChange={onChange} idPrefix={id} />
        </fieldset>
      );
    case 'list':
      return (
        <fieldset className="em-fieldset">
          <legend>{field.label}</legend>
          <ListEditor spec={field} items={value || []} onChange={onChange} idPrefix={id} />
        </fieldset>
      );
    case 'strings':
      return <StringList id={id} label={field.label} items={value || []} onChange={onChange} placeholder={field.placeholder} />;
    case 'bool':
      return (
        <label className="em-check" htmlFor={id}>
          <input id={id} type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          <span>{field.label}</span>
        </label>
      );
    case 'select':
      return (
        <label className="em-field" htmlFor={id}>
          <span>{field.label}</span>
          <select id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
            <option value="">Not set</option>
            {field.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
      );
    case 'textarea':
      return (
        <label className="em-field" htmlFor={id}>
          <span>{field.label}</span>
          <textarea id={id} rows={3} value={value ?? ''} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
        </label>
      );
    case 'number':
      return (
        <label className="em-field" htmlFor={id}>
          <span>{field.label}</span>
          <input
            id={id}
            type="number"
            step="any"
            inputMode="decimal"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          />
        </label>
      );
    default:
      return (
        <label className="em-field" htmlFor={id}>
          <span>{field.label}</span>
          <input
            id={id}
            type={field.type || 'text'}
            value={value ?? ''}
            placeholder={field.placeholder}
            inputMode={field.type === 'tel' ? 'tel' : undefined}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      );
  }
}

function ListEditor({ spec, items, onChange, idPrefix }) {
  const exclusive = spec.fields.filter((f) => f.exclusive).map((f) => f.key);

  const update = (index, next) => {
    let list = items.map((item, i) => (i === index ? next : item));
    // e.g. only one contact can be "call first"
    exclusive.forEach((key) => {
      if (next[key] && !items[index][key]) list = list.map((item, i) => (i === index ? item : { ...item, [key]: false }));
    });
    onChange(list);
  };

  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const list = [...items];
    [list[index], list[target]] = [list[target], list[index]];
    onChange(list);
  };

  const remove = (index) => onChange(items.filter((_, i) => i !== index));

  return (
    <div className="em-list-editor">
      {items.length === 0 && <p className="em-empty">Nothing added yet</p>}
      {items.map((item, i) => (
        <div key={i} className="em-list-item">
          <div className="em-list-item__head">
            <strong>{item[spec.fields[0].key] || `New ${spec.itemName}`}</strong>
            <div className="em-list-item__tools">
              <button type="button" className="em-icon-btn em-icon-btn--sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                <ArrowUp aria-hidden="true" />
              </button>
              <button
                type="button"
                className="em-icon-btn em-icon-btn--sm"
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                aria-label="Move down"
              >
                <ArrowDown aria-hidden="true" />
              </button>
              <button type="button" className="em-icon-btn em-icon-btn--sm" onClick={() => remove(i)} aria-label={`Remove this ${spec.itemName}`}>
                <Trash2 aria-hidden="true" />
              </button>
            </div>
          </div>
          <GroupFields fields={spec.fields} value={item} onChange={(v) => update(i, v)} idPrefix={`${idPrefix}-${i}`} />
        </div>
      ))}
      <button type="button" className="em-btn em-btn--add" onClick={() => onChange([...items, { ...spec.blank }])}>
        <Plus aria-hidden="true" /> Add {spec.itemName}
      </button>
    </div>
  );
}

function StringList({ id, label, items, onChange, placeholder }) {
  const [text, setText] = useState('');
  const add = () => {
    const value = text.trim();
    if (!value) return;
    if (!items.includes(value)) onChange([...items, value]);
    setText('');
  };
  return (
    <div className="em-field">
      <label htmlFor={id}>{label}</label>
      {items.length > 0 && (
        <ul className="em-chips-edit">
          {items.map((item) => (
            <li key={item}>
              {item}
              <button type="button" onClick={() => onChange(items.filter((x) => x !== item))} aria-label={`Remove ${item}`}>
                <X aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="em-inline">
        <input
          id={id}
          value={text}
          placeholder={placeholder}
          onChange={(e) => setText(e.target.value)}
          // Tapping Save or another tab blurs the field first, so typed-but-not-added text isn't lost.
          // Not when the whole window loses focus (switching apps): the text is still here on return.
          onBlur={() => document.hasFocus() && add()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="em-btn" onClick={add}>
          <Plus aria-hidden="true" /> Add
        </button>
      </div>
    </div>
  );
}
