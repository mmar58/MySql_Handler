<script lang="ts">
    import { X } from "@lucide/svelte";
    import { scale, fade } from "svelte/transition";
    import { socket } from "$lib/services/socket";
    import { addNotification } from "$lib/state.svelte";
    import { onMount, onDestroy } from "svelte";

    let { isOpen = $bindable(false) } = $props();
    let databaseName = $state("");
    let isCreating = $state(false);

    function handleCreated(data: any) {
        addNotification({ title: "Success", message: data.message, type: 'success' });
        isCreating = false;
        isOpen = false;
        databaseName = "";
        socket.emit("get_databases");
    }

    function handleError(data: any) {
        addNotification({ title: "Error", message: data.message, type: 'error' });
        isCreating = false;
    }

    $effect(() => {
        if (isOpen) {
            socket.on("database_created", handleCreated);
            socket.on("error", handleError);
        } else {
            socket.off("database_created", handleCreated);
            socket.off("error", handleError);
            databaseName = "";
        }
    });

    onDestroy(() => {
        socket.off("database_created", handleCreated);
        socket.off("error", handleError);
    });

    function createDatabase() {
        if (!databaseName.trim()) return;
        isCreating = true;
        socket.emit("create_database", databaseName.trim());
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter') {
            createDatabase();
        } else if (e.key === 'Escape') {
            isOpen = false;
        }
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div 
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        transition:fade={{ duration: 150 }}
        onclick={() => isOpen = false}
    >
        <div 
            class="bg-card text-card-foreground border rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col"
            transition:scale={{ duration: 200, start: 0.95 }}
            onclick={(e) => e.stopPropagation()}
        >
            <div class="px-4 py-3 border-b flex justify-between items-center bg-muted/30">
                <h3 class="font-semibold text-lg">Create Database</h3>
                <button 
                    class="p-1 hover:bg-muted rounded-md transition-colors"
                    onclick={() => isOpen = false}
                >
                    <X class="w-5 h-5 text-muted-foreground hover:text-foreground" />
                </button>
            </div>
            
            <div class="p-6 space-y-4 flex-1 overflow-auto">
                <div class="space-y-2">
                    <label for="dbName" class="text-sm font-medium">Database Name</label>
                    <input 
                        id="dbName"
                        type="text" 
                        bind:value={databaseName}
                        onkeydown={handleKeydown}
                        placeholder="e.g. my_database"
                        class="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>
            </div>
            
            <div class="p-4 border-t bg-muted/20 flex justify-end gap-2">
                <button 
                    class="px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium transition-colors"
                    onclick={() => isOpen = false}
                    disabled={isCreating}
                >
                    Cancel
                </button>
                <button 
                    class="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors flex items-center justify-center min-w-[80px]"
                    onclick={createDatabase}
                    disabled={isCreating || !databaseName.trim()}
                >
                    {#if isCreating}
                        <div class="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2"></div>
                        Creating...
                    {:else}
                        Create
                    {/if}
                </button>
            </div>
        </div>
    </div>
{/if}
