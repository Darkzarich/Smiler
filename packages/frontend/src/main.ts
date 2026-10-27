import 'normalize.css';
import '@fontsource-variable/roboto';
import '@fontsource-variable/roboto/wght-italic.css';
import { vOnClickOutside } from '@vueuse/components';
import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import { pinia } from '@/store';

const app = createApp(App);

app.use(pinia);
app.use(router);
app.directive('on-click-outside', vOnClickOutside);

app.mount('#app');
