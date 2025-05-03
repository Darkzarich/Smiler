import 'normalize.css';
// import vClickOutside from 'v-click-outside';
import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import store from '@/store/index';

// TODO: Replace with VueUse
// Vue.use(vClickOutside);

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

app.mount('#app');
