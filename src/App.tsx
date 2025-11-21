import Game from './components/Game';
import { LanguageProvider } from './i18n/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <Game />
    </LanguageProvider>
  );
}

export default App;
