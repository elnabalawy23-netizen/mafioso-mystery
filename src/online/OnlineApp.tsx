import { OnlineProvider, useOnline } from './OnlineContext';
import { PreRoom } from './PreRoom';
import { InRoom } from './InRoom';
import { ScreenShell } from '../components/ui';

function OnlineRouter({ onExit }: { onExit: () => void }) {
  const { code, playerId, view } = useOnline();
  if (code && playerId) {
    if (!view) {
      return (
        <ScreenShell center>
          <p className="text-center text-sm text-muted">لحظة… بنوصّلك بالغرفة</p>
        </ScreenShell>
      );
    }
    return <InRoom />;
  }
  return <PreRoom onExit={onExit} />;
}

export default function OnlineApp({ onExit }: { onExit: () => void }) {
  return (
    <OnlineProvider>
      <OnlineRouter onExit={onExit} />
    </OnlineProvider>
  );
}
