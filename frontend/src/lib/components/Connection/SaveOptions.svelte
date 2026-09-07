<script lang="ts">
    /** Bound boolean indicating if the user wants to save this connection */
    export let saveConnection = false;
    /** Bound choice of where to save the connection */
    export let saveLocation: "local" | "server" = "local";
    /** Bound choice of IP restriction (all, current, selected) */
    export let ipRestriction: "all" | "current" | "selected" = "current";
    /** Read-only prop of the current user's IP */
    export let currentIp = "";
    /** Bound text containing comma-separated specific IPs */
    export let selectedIpsText = "";
</script>

<div class="flex flex-col gap-3">
    <label class="flex items-center gap-2 text-sm font-medium cursor-pointer w-fit">
        <input
            type="checkbox"
            bind:checked={saveConnection}
            class="rounded border-input text-primary focus:ring-primary h-4 w-4"
        />
        Save this connection
    </label>

    {#if saveConnection}
        <div class="flex flex-col gap-3 pl-6">
            <div class="flex gap-4">
                <label class="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors w-fit">
                    <input
                        type="radio"
                        bind:group={saveLocation}
                        value="local"
                        class="text-primary focus:ring-primary"
                    />
                    Local Storage
                </label>
                <label class="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors w-fit">
                    <input
                        type="radio"
                        bind:group={saveLocation}
                        value="server"
                        class="text-primary focus:ring-primary"
                    />
                    Server DB
                </label>
            </div>

            {#if saveLocation === "server"}
                <div class="flex flex-col gap-2 mt-2">
                    <label for="ipRestriction" class="text-sm font-medium leading-none text-muted-foreground">IP Restriction</label>
                    <select
                        id="ipRestriction"
                        bind:value={ipRestriction}
                        class="flex h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <option value="current">Only allow my current IP {currentIp ? `(${currentIp})` : ''}</option>
                        <option value="selected">Allow specific IPs</option>
                        <option value="all">Allow all IPs</option>
                    </select>
                    
                    {#if ipRestriction === 'selected'}
                        <label for="specificIps" class="text-sm font-medium leading-none text-muted-foreground mt-2">Specific IPs (comma separated)</label>
                        <textarea
                            id="specificIps"
                            bind:value={selectedIpsText}
                            placeholder="192.168.1.1, 10.0.0.1"
                            class="flex min-h-[60px] w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        ></textarea>
                    {/if}
                </div>
            {/if}
        </div>
    {/if}
</div>
