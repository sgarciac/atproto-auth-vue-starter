<script setup lang="ts">
import { ref, type Ref, computed, defineProps } from "vue";

interface UserProfile {
  displayName?: string;
  description?: string;
  avatarId?: string;
  bannerId?: string;
  did: string;
}

interface Props {
  user: UserProfile;
}

const props = defineProps<Props>();

const namespace: Ref<string> = ref("ufos.are.real.sightings");

const recordData: Ref<string> = ref(
  `{
    "location": {
      "latitude": 37.7749,
      "longitude": -122.4194
    },
    "date": "2023-10-01T12:00:00Z",
    "witnesses": [
      {
        "name": "John Doe",
        "age": 30,
        "description": "Saw a bright light in the sky."
      }
    ]
  }`
);

const createdRecordUri: Ref<string | undefined> = ref();
const createRecordError: Ref<string | undefined> = ref();

const avatarLink = computed(() => {
  if (props.user && props.user.avatarId) {
    return props.user.avatarId;
  }
});

async function createNewRecord() {
  createdRecordUri.value = undefined;
  createRecordError.value = undefined;
  if (namespace.value.trim() === "" || recordData.value.trim() === "") {
    createRecordError.value = "Please provide a namespace and record data.";
    return;
  }

  try {
    JSON.parse(recordData.value);
  } catch (e) {
    createRecordError.value = "Invalid JSON format for record data.";
    return;
  }

  const response = await fetch("/api/record", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      namespace: namespace.value,
      data: JSON.parse(recordData.value),
    }),
  });
  if (response.ok) {
    const result = await response.json();
    createdRecordUri.value = result.uri;
  } else {
    createRecordError.value = "Failed to create record u_u";
  }
}
</script>

<template>
  <main id="logged-component" class="flex-1 flex items-start justify-center">
    <div class="flex flex-col items-center gap-2">
      <div class="avatar" v-if="user.avatarId">
        <div class="w-24 rounded-xl">
          <img :src="avatarLink" />
        </div>
      </div>
      <form method="POST" class="flex flex-row" action="/auth/logout">
        <button type="submit" class="btn btn-error btn-sm">Logout</button>
      </form>
      <div class="mt-5">
        <div class="flex flex-col gap-4 w-full max-w-md">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Collection Namespace Identifier</span>
            </label>
            <input
              v-model="namespace"
              type="text"
              placeholder="Enter namespace"
              class="input input-bordered w-full"
            />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">New Record Data</span>
            </label>
            <textarea
              v-model="recordData"
              placeholder="Enter record data"
              class="textarea textarea-bordered w-full"
              rows="15"
            ></textarea>
          </div>
          <div class="btn btn-primary" @click="createNewRecord">
            Create New Record
          </div>

          <div role="alert" v-if="createRecordError" class="alert alert-error">
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
            <span>{{ createRecordError }}</span>
          </div>

          <div role="alert" v-if="createdRecordUri" class="alert alert-success">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span
              >You created
              <a
                class="link link-primary text-lg font-bold"
                :href="`https://pdsls.dev/${createdRecordUri}`"
                target="_blank"
                >a brand new ATPRoto record!</a
              ></span
            >
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
