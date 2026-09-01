import { registerRootComponent } from 'expo';
import { injectWebScrollbarStyles } from './src/styles/webScrollbar';
import App from './App';

// Injeta estilização e visibilidade de barra de rolagem para navegadores Web
injectWebScrollbarStyles();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
