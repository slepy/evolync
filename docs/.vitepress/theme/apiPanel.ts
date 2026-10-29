import { ref } from 'vue';

/** Endpoint shown in the details panel; any chip or screen pin sets it. */
export const openEndpointId = ref<string | null>(null);

export const openEndpoint = (id: string) => {
  openEndpointId.value = id;
};

export const closeEndpoint = () => {
  openEndpointId.value = null;
};
