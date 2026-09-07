<script lang="ts">
    import { Trash2, Settings2 } from "@lucide/svelte";
    import type { ServerConnection } from "$lib/types";

    /** Array of saved connections fetched from local storage and server */
    export let savedConnections: ServerConnection[] = [];
    /** The currently selected connection ID */
    export let selectedConnectionId: string = "";
    
    /** Triggered when a connection is selected from the dropdown */
    export let onSelect: () => void = () => {};
    /** Triggered when the delete button is clicked for the selected connection */
    export let onDelete: (id: string) => void = () => {};
    /** Triggered when the manage connections button is clicked */
    export let onManage: () => void = () => {};

    function handleSelect() {
        onSelect();
    }
</script>

{#if savedConnections.length > 0}
    <div class="flex flex-col gap-2 p-4 bg-muted/50 rounded-lg border">
        <label for="saved-connections-select" class="text-sm font-medium text-foreground">Saved Connections</label>
        <div class="flex gap-2">
            <select
                id="saved-connections-select"
                bind:value={selectedConnectionId}
                onchange={handleSelect}
                class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <option value="">-- Select a connection --</option>
                {#each savedConnections as conn}
                    <option value={conn._id}>
                        {conn.user}@{conn.host}:{conn.port}
                        {conn.database ? `(${conn.database})` : ""} [{conn.engine}]
                    </option>
                {/each}
            </select>
            
            {#if selectedConnectionId}
                <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-destructive hover:text-destructive-foreground h-10 px-4 py-2"
                    onclick={() => onDelete(selectedConnectionId)}
                    title="Delete connection"
                >
                    <Trash2 class="w-4 h-4" />
                </button>
            {/if}
            
            <button
                type="button"
                class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-muted hover:text-foreground h-10 px-4 py-2"
                onclick={onManage}
                title="Manage connections"
            >
                <Settings2 class="w-4 h-4" />
            </button>
        </div>
    </div>
{/if}
