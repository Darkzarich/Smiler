import 'normalize.css';
// TODO: Replace with a solution from VueUse
import vClickOutside from 'click-outside-vue3';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);
app.use(vClickOutside);

// TODO: Replace with a solution from VueUse
app.directive('scroll', {
  mounted(el, binding) {
    const f = (evt) => {
      binding.value(evt, el);
    };
    window.addEventListener('scroll', f);
  },
});

app.mount('#app');
