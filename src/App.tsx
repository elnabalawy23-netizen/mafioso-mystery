import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { unlockAudio } from './audio/sound';
import { GameProvider, useGame } from './game/GameContext';
import { AppModeContext } from './game/appMode';
import OnlineApp from './online/OnlineApp';
import SplashScreen from './screens/SplashScreen';
import HomeScreen from './screens/HomeScreen';
import SelectCaseScreen from './screens/SelectCaseScreen';
import AddPlayersScreen from './screens/AddPlayersScreen';
import CharacterRevealScreen from './screens/CharacterRevealScreen';
import CrimeStoryScreen from './screens/CrimeStoryScreen';
import DiscussionScreen from './screens/DiscussionScreen';
import ClueRevealScreen from './screens/ClueRevealScreen';
import VotingScreen from './screens/VotingScreen';
import WrongVoteScreen from './screens/WrongVoteScreen';
import CorrectVoteScreen from './screens/CorrectVoteScreen';
import FinalExplanationScreen from './screens/FinalExplanationScreen';
import PlayAgainScreen from './screens/PlayAgainScreen';

function Router() {
  const { phase } = useGame();

  return (
    <AnimatePresence mode="wait">
      {phase === 'splash' && <SplashScreen key="splash" />}
      {phase === 'home' && <HomeScreen key="home" />}
      {phase === 'selectCase' && <SelectCaseScreen key="selectCase" />}
      {phase === 'addPlayers' && <AddPlayersScreen key="addPlayers" />}
      {phase === 'reveal' && <CharacterRevealScreen key="reveal" />}
      {phase === 'crime' && <CrimeStoryScreen key="crime" />}
      {phase === 'discussion' && <DiscussionScreen key="discussion" />}
      {phase === 'clue' && <ClueRevealScreen key="clue" />}
      {phase === 'voting' && <VotingScreen key="voting" />}
      {phase === 'wrong' && <WrongVoteScreen key="wrong" />}
      {phase === 'correct' && <CorrectVoteScreen key="correct" />}
      {phase === 'final' && <FinalExplanationScreen key="final" />}
      {phase === 'again' && <PlayAgainScreen key="again" />}
    </AnimatePresence>
  );
}

export default function App() {
  const [mode, setMode] = useState<'local' | 'online'>('local');
  // Unlock the audio context on the first user gesture (mobile autoplay policy).
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);
  return (
    <div className="app-bg">
      <div className="grain" />
      {mode === 'online' ? (
        <OnlineApp onExit={() => setMode('local')} />
      ) : (
        <AppModeContext.Provider value={{ goOnline: () => setMode('online') }}>
          <GameProvider>
            <Router />
          </GameProvider>
        </AppModeContext.Provider>
      )}
    </div>
  );
}
