<script setup lang="ts">
import { ref, computed } from "vue";

const handle = ref("");
const globalErrorCode = new URLSearchParams(window.location.search).get(
  "error"
);

const props = defineProps<{
  settingErrorCode?: string;
}>();

const errorMessage = computed(() => {
  switch (globalErrorCode) {
    case "bad_handle":
      return "Invalid handle";
    case "client_error":
      return "An error occurred while processing your login request :-(";
    default:
      return undefined;
  }
});
</script>

<template>
  <main class="flex-1 flex items-center justify-center">
    <div class="card bordered bg-base-200 w-96 shadow-xl items-center p-8">
      <div class="card-body">
        <div class="flex flex-row justify-center text-error">
          {{ errorMessage }}
        </div>
        <form action="/auth/login" method="post">
          <div class="form-control">
            <label class="input input-bordered flex items-center gap-2">
              <!-- lucide 1.25 16px-->
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.25"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-circle-user opacity-70"
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="10" r="3" />
                <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
              </svg>
              <input
                name="handle"
                v-model="handle"
                required
                type="text"
                class="grow"
                placeholder="Enter your handle (e.g. elon)"
              />
            </label>
          </div>
          <div class="form-control mt-6">
            <button
              :disabled="!/^\s*[a-zA-Z0-9][\.a-zA-Z0-9-]*\s*$/.test(handle)"
              class="btn btn-block normal-case font-semibold border-white border-2 rounded-none focus:ring-2"
            >
              <img
                class="w-5 h-5 mr-1"
                src="../assets/bluesky.svg"
                loading="lazy"
                alt=""
              />
              {{
                /^\s*[a-zA-Z0-9][a-zA-Z0-9-]*\s*$/.test(handle) ||
                handle === "" ||
                /^\s*[a-zA-Z0-9][a-zA-Z0-9-]*\.bsky\.social\s*$/.test(handle)
                  ? "Login with Bluesky Social"
                  : "Login with Custom Server"
              }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </main>
</template>
