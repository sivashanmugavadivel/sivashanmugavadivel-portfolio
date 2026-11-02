import { ArrowLeft, Eye } from 'lucide-react';
import EmergencyView from '../components/EmergencyView';
import OwnerEditor from '../components/OwnerEditor';
import { blankProfile } from '../sampleData';

/**
 * One member's page as its owner (or the admin) works on it: the page with Edit and a menu, the
 * editor, and a preview of exactly what a responder gets after the PIN.
 * `mode` is 'view' | 'edit' | 'preview'; the parent keeps it so its own screens can sit alongside.
 */
export default function ProfilePages({ profile, mode, onMode, onSave, title, editTitle, actions = [], banner, onSignOut }) {
  const data = profile || blankProfile;

  if (mode === 'edit') {
    return (
      <OwnerEditor
        initial={data}
        isNew={!profile}
        title={editTitle}
        onSave={async (draft) => {
          await onSave(draft);
          onMode('view');
        }}
        onClose={() => onMode('view')}
      />
    );
  }

  if (mode === 'preview') {
    const back = () => onMode('view');
    return (
      <EmergencyView
        data={data}
        role="viewer"
        onBack={back}
        banner={
          <>
            {/* Takes focus on arrival (screenFocus.js), so a screen reader hears it's a preview. */}
            <p tabIndex={-1} data-screen-focus>
              <strong>Preview.</strong> This is what responders see after they enter the PIN.
            </p>
            <button type="button" className="em-btn" onClick={back}>
              <ArrowLeft aria-hidden="true" /> Back
            </button>
          </>
        }
      />
    );
  }

  return (
    <EmergencyView
      data={data}
      role="owner"
      title={title}
      onEdit={() => onMode('edit')}
      onSignOut={onSignOut}
      actions={[{ label: 'Preview as responder', icon: Eye, onClick: () => onMode('preview') }, ...actions]}
      banner={banner}
    />
  );
}
