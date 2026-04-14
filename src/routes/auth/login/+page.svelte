<script lang="ts">
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
</script>

<div class="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-6" style="font-family: Inter, sans-serif;">
  <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-8 w-full max-w-md">
    <div class="mb-7">
      <h1 class="text-2xl font-bold text-gray-900 mb-1">Sign in</h1>
      <p class="text-[13px] text-gray-500">Workshop Mode</p>
    </div>

    {#if form?.error}
      <div class="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-700">
        {form.error}
      </div>
    {/if}

    <form method="POST" class="space-y-4">
      <div>
        <label class="block text-[12px] font-medium text-gray-700 mb-1.5" for="email">Email</label>
        <input id="email" name="email" type="email" required autocomplete="email"
          class="w-full px-3 py-2.5 bg-[#FAFAF9] border border-gray-200 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent" />
      </div>
      <div>
        <label class="block text-[12px] font-medium text-gray-700 mb-1.5" for="password">Password</label>
        <input id="password" name="password" type="password" required autocomplete="current-password"
          class="w-full px-3 py-2.5 bg-[#FAFAF9] border border-gray-200 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6B9695] focus:border-transparent" />
      </div>
      <button type="submit"
        class="w-full py-2.5 bg-[#6B9695] hover:bg-[#5A8584] text-white rounded-lg text-[14px] font-medium transition-colors mt-2">
        Sign in
      </button>
    </form>

    <p class="text-center text-[13px] text-gray-500 mt-5">
      Don't have an account?
      <a href="/auth/register" class="text-[#6B9695] font-medium hover:underline">Register</a>
    </p>
  </div>
</div>
