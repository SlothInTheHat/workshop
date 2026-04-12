<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

<div class="min-h-screen bg-[#f5f5f0]" style="font-family: Inter, sans-serif;">
  <nav class="h-16 bg-[#fbfbfb] border-b border-gray-200 px-6 flex items-center sticky top-0 z-50">
    <a href="/" class="flex items-center hover:opacity-80 transition-opacity ml-2">
      <img src="/optura-logo.png" alt="Optura" class="h-10" />
    </a>
  </nav>
  <main>
    {@render children()}
  </main>
</div>
