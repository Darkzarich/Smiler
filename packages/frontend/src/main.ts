import 'normalize.css';
import { vOnClickOutside } from '@vueuse/components';
import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import { pinia } from '@/store';

const app = createApp(App);

app.use(pinia);
app.use(router);
app.directive('on-click-outside', vOnClickOutside);

// TODO: Replace with a solution from VueUse
app.directive('scroll', {
  mounted(el, binding) {
    const f = (evt: Event) => {
      binding.value(evt, el);
    };
    window.addEventListener('scroll', f);
  },
});

app.mount('#app');
