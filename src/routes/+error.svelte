<script lang="ts">
  import { page } from '$app/state';
</script>

<div class="flex min-h-[60vh] items-center justify-center">
  <div class="text-center">
    <h1 class="text-foreground text-4xl font-bold">{page.status}</h1>
    <p class="text-muted-foreground mt-2">{page.error?.message}</p>
    <a
      href="/"
      class="text-primary mt-4 inline-block underline hover:no-underline"
    >
      Go home
    </a>
  </div>
</div>
