<template>
  <div class="user-registration">
    <input type="text" name="email" v-model="email"><br>
    <input type="text" name="username" v-model="login">
    <br>
    <input type="password" name="password" v-model="password">
    <br><input type="password" name="confirm" v-model="confirm">
    <br><button @click="register">Finish</button>
  </div>
</template>

<script>
import api from '@/api'

export default {
  data() {
    return {
      email: '',
      login: '',
      password: '',
      confirm: '',
    }
  }
}
</script>

<style>

</style>
