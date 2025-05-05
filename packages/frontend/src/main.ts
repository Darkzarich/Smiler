import 'normalize.css';
import vClickOutside from 'click-outside-vue3';
import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import store from '@/store/index';

const app = createApp(App);

app.use(router);
app.use(store);

// TODO: Replace with a solution from VueUse
app.directive('scroll', {
  mounted(el, binding) {
    const f = (evt) => {
      binding.value(evt, el);
    };
    window.addEventListener('scroll', f);
  },
});

app.use(vClickOutside);

app.mount('#app');
