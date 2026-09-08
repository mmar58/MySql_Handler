<script lang="ts">
    import { appState, removeNotification } from "$lib/state.svelte";
    import { Info, CheckCircle, AlertTriangle, XCircle, X } from "@lucide/svelte";
    import { fade, fly } from "svelte/transition";

    function getIcon(type: string) {
        switch (type) {
            case 'success': return CheckCircle;
            case 'warning': return AlertTriangle;
            case 'error': return XCircle;
            default: return Info;
        }
    }

    function getColor(type: string) {
        switch (type) {
            case 'success': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'warning': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'error': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
        }
    }
</script>

<div class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
    {#each appState.notifications as notification (notification.id)}
        {@const Icon = getIcon(notification.type)}
        <div 
            class="pointer-events-auto bg-card border rounded-lg shadow-lg overflow-hidden"
            in:fly={{ y: 20, duration: 300 }}
            out:fade={{ duration: 200 }}
        >
            <div class={`p-3 flex items-start gap-3 border-l-4 ${getColor(notification.type).split(' ')[0].replace('text-', 'border-')}`}>
                <div class={`mt-0.5 shrink-0 ${getColor(notification.type).split(' ')[0]}`}>
                    <Icon size={18} />
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-semibold text-foreground">{notification.title}</h4>
                    <p class="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
                    
                    {#if notification.progress !== undefined || notification.isIndeterminate}
                        <div class="mt-2 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                            {#if notification.isIndeterminate}
                                <div class="h-full bg-primary/70 rounded-full w-1/3 animate-pulse"></div>
                            {:else}
                                <div class="h-full bg-primary transition-all duration-300 rounded-full" style={`width: ${notification.progress}%`}></div>
                            {/if}
                        </div>
                    {/if}

                    {#if notification.actionLabel && notification.onAction}
                        <button 
                            class="mt-2 text-xs font-medium text-primary hover:underline focus:outline-none"
                            onclick={() => { notification.onAction?.(); }}
                        >
                            {notification.actionLabel}
                        </button>
                    {/if}
                </div>
                <button 
                    class="shrink-0 p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                    onclick={() => removeNotification(notification.id)}
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    {/each}
</div>
