<script setup lang="ts">
import { ref, type Ref, onBeforeMount, computed } from "vue";
import RecordCreator from "./components/RecordCreator.vue";
import LoginBox from "./components/LoginBox.vue";

const loading = ref(true);
const user: Ref<UserProfile | undefined> = ref();
const systemCheckErrorCode: Ref<string | undefined> = ref();

export interface UserProfile {
  displayName?: string;
  description?: string;
  avatarId?: string;
  bannerId?: string;
  did: string;
}

const systemErrorMessage = computed(() => {
  switch (systemCheckErrorCode.value) {
    case "dpop_session_store_not_found":
      return "DPOP_SESSION_STORE binding not found.";
    case "dpop_state_store_not_found":
      return "DPOP_STATE_STORE binding not found.";
    case "blank_secret":
      return "SECRET not found or too short.";
    case "prefer_ip_over_localhost":
      return "Please use the <a href='http://127.0.0.1:8787'>http://127.0.0.1:8787</a> instead of localhost.  Blame RFC8252, section 8.3";
    case "private_jwk_not_found":
      return "PRIVATE_JWK not found.";
    case "client_error":
      return "An error occurred while calling the APIs";
    case "settings-check-failed":
      return "this is really bad, I failed to contact the backend :-(";
    default:
      return undefined;
  }
});

onBeforeMount(async () => {
  try {
    systemCheckErrorCode.value = (
      await (await fetch("/api/settings-check")).json()
    ).error;
    if (!systemCheckErrorCode.value) {
      const userResponse = await fetch("/api/user");
      if (userResponse.ok) {
        user.value = (await userResponse.json()) as UserProfile;
      }
    }
  } catch (error) {
    console.error("Error fetching settings checks or user data:", error);
    systemCheckErrorCode.value = "settings-check-failed"; // Fallback error code
  }
  loading.value = false;
});
</script>

<template>
  <div
    class="min-h-screen flex justify-center max-w-xl flex-col mx-auto"
    v-cloak
    v-if="!loading"
  >
    <div role="alert" v-if="systemCheckErrorCode" class="alert alert-error">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6 shrink-0 stroke-current"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span v-html="systemErrorMessage"></span>
    </div>
    <div v-else>
      <!-- USER IS LOGGED IN -->
      <RecordCreator :user="user" v-if="user" />
      <!-- USER IS *NOT* LOGGED IN  -->
      <LoginBox v-else />
    </div>
  </div>
</template>
<style scoped>
[v-cloak] {
  display: none;
}
</style>
