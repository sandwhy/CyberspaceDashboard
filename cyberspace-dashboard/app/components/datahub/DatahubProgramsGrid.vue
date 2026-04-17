<template>
  <v-data-iterator
    :items="items"
    :search="search"
    :loading="isLoading"
    :headers="headers"
    :items-per-page="-1"
    :sort-by="[{ key: 'id', order: 'asc' }]"
    class="bg-grey-darken-4 pa-4" 
  >
    <template v-slot:default="{ items }">
      <v-container fluid class="pa-0">
        <v-card 
          v-for="item in items" 
          :key="item.raw.id" 
          class="mb-4 rounded-xl bg-grey-darken-3 border-thin" 
          elevation="2"
          hover
        >
          <div class="d-flex align-center pa-4 ga-4">
            <div class="text-h6 font-weight-bold text-grey-lighten-1 px-2" style="min-width: 40px">
              {{ item.raw.id }}
            </div>

            <v-avatar rounded="lg" size="64" class="bg-grey-darken-4 elevation-4 border border-opacity-25">
              <v-img :src="item.raw.image_url || 'http://localhost:5000/uploads/placeholder-robot.png'" cover ></v-img>
            </v-avatar>

            <div class="flex-grow-1" style="min-width: 150px">
              <div class="text-h6 font-weight-bold text-white mb-n1">{{ item.raw.title }}</div>
              <div class="text-caption font-weight-medium text-orange-lighten-2">
                <v-icon size="x-small" class="mr-1">mdi-account-group</v-icon>
                {{ item.raw.age_range }}
              </div>
            </div>

            <div class="text-body-2 text-grey-lighten-1 text-truncate hidden-sm-and-down" style="max-width: 300px">
              {{ item.raw.description }}
            </div>

            <div class="text-center px-4">
              <v-chip
                size="small"
                :color="item.raw.is_active ? 'success' : 'error'"
                variant="flat"
                class="text-uppercase font-weight-black"
              >
                {{ item.raw.is_active ? 'Active' : 'Inactive' }}
              </v-chip>
            </div>

            <div class="d-flex ga-2">
              <v-btn 
                variant="tonal" 
                color="primary" 
                rounded="lg"
                class="text-none"
                prepend-icon="mdi-pencil"
                @click="$emit('edit-program', item.raw)" 
              >
                Edit  
              </v-btn>
            </div>
          </div>
        </v-card>
      </v-container>
    </template>
  </v-data-iterator>
</template>

<script setup>
defineProps({
  items: Array,
  search: String,
  isLoading: Boolean,
  headers: Array
})
defineEmits(['edit-program'])
</script>
