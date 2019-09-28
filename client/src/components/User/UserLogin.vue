<template>
  <div class="user-login">
    <input type="text" name="email" v-model="email">
    <br>
    <input type="password" name="password" v-model="password">
    <br><button @click="login">Login</button>
  </div>
</template>

<script>
import api from '@/api';

export default {
  data() {
    return {
      email: '',
      password: '',
    };
  },
  methods: {
    async login() {
      const res = await api.users.authUser({
        email: this.email,
        password: this.password,
      });

      if (res.data.isAuth) {
        this.$store.commit('setUser', res.data);
      }
    },
  },
};
</script>

<style>

</style>
