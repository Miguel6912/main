import { Card } from '../../components/Card';
import { AvatarPicker } from '../../components/avatar/AvatarPicker';
import { useAppMeta } from '../hooks/useAppMeta';
import './AvatarPage.css';

export function AvatarPage() {
  const { meta, patch } = useAppMeta();
  if (!meta) return null;

  return (
    <div className="avatar-page">
      <h1>Your Avatar</h1>
      <p className="avatar-page-intro">
        Make it yours -- pick a look that feels like you, or go for a fox, deer, or owl instead.
      </p>

      <Card className="avatar-page-name-card">
        <label className="avatar-page-name-label" htmlFor="display-name">
          Display name
        </label>
        <input
          id="display-name"
          type="text"
          className="avatar-page-name-input"
          value={meta.displayName}
          maxLength={24}
          placeholder="What should we call you?"
          onChange={(e) => patch({ displayName: e.target.value })}
        />
      </Card>

      <AvatarPicker config={meta.avatarConfig} onChange={(avatarConfig) => patch({ avatarConfig })} />
    </div>
  );
}
