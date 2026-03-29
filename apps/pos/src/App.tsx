import { AppView } from "./components/AppView";
import { AuthLoadingScreen } from "./components/AuthLoadingScreen";
import { AuthScreen } from "./components/AuthScreen";
import { usePosAppController } from "./hooks/usePosAppController";

function App() {
  const { authReady, authUser, handleAuthSuccess, appViewProps } = usePosAppController();

  if (!authReady) {
    return <AuthLoadingScreen />;
  }

  if (!authUser || !appViewProps) {
    return <AuthScreen onAuthenticated={handleAuthSuccess} />;
  }

  return <AppView {...appViewProps} />;
}

export default App;
