<script lang="ts">
    import { onMount } from "svelte";
    import { X, Database, Server, Key, Settings2, Save, Trash2, ChevronUp, ChevronDown } from "@lucide/svelte";
    import { api } from "$lib/services/api";
    import { appState } from "$lib/state.svelte";
    import type { ServerConnection } from "$lib/types";

    let connections = $state<ServerConnection[]>([]);
    let isLoading = $state(false);
    let errorMsg = $state("");
    let expandedId = $state<string | null>(null);

    // Form states for the expanded connection
    let editState = $state<Partial<ServerConnection>>({});
    let currentIp = $state("");
    let selectedIpsText = $state("");

    async function loadConnections() {
        isLoading = true;
        errorMsg = "";
        try {
            const serverRes = await api.get<{ status: string; connections: Record<string, ServerConnection> }>("/connections/list");
            let list: ServerConnection[] = [];
            if (serverRes && serverRes.connections) {
                list = Object.entries(serverRes.connections).map(([id, c]) => ({
                    ...c,
                    _id: id,
                    _location: "server"
                }));
            }

            const localRaw = localStorage.getItem("db_manager_connections");
            if (localRaw) {
                try {
                    const localList = JSON.parse(localRaw);
                    list = [...list, ...localList.map((c: any) => ({ ...c, _location: 'local' }))];
                } catch (e) {}
            }

            connections = list;
        } catch (err: any) {
            errorMsg = "Failed to load connections: " + err.message;
        } finally {
            isLoading = false;
        }
    }

    async function fetchIp() {
        try {
            const res = await api.get<{ ip: string }>("/my-ip");
            if (res && res.ip) currentIp = res.ip;
        } catch (err) {
            console.error("Failed to fetch IP", err);
        }
    }

    $effect(() => {
        if (appState.isConnectionManagerOpen) {
            loadConnections();
            fetchIp();
        }
    });

    function handleExpand(conn: ServerConnection) {
        if (expandedId === conn._id) {
            expandedId = null;
            return;
        }
        expandedId = conn._id || null;
        editState = { ...conn };
        selectedIpsText = (conn.selectedIps || []).join(", ");
    }

    function handleMinimize() {
        expandedId = null;
    }

    async function saveConnection(originalId: string) {
        const payload: ServerConnection = {
            ...editState,
            ipRestriction: editState.ipRestriction || 'current',
            selectedIps: editState.ipRestriction === 'selected' ? selectedIpsText.split(',').map(ip => ip.trim()).filter(Boolean) : undefined,
        } as ServerConnection;

        try {
            if (payload._location === "server") {
                await api.post("/connections/save", { id: originalId, connection: payload });
            } else {
                const localRaw = localStorage.getItem("db_manager_connections");
                let localList: ServerConnection[] = [];
                if (localRaw) {
                    try { localList = JSON.parse(localRaw); } catch (e) {}
                }
                const idx = localList.findIndex(c => c._id === originalId);
                if (idx !== -1) {
                    localList[idx] = payload;
                } else {
                    localList.push(payload);
                }
                localStorage.setItem("db_manager_connections", JSON.stringify(localList));
            }
            await loadConnections();
            expandedId = null; // Close after save
        } catch (err: any) {
            alert("Failed to save: " + err.message);
        }
    }

    async function deleteConnection(id: string, location: string) {
        if (!confirm("Are you sure you want to delete this connection?")) return;
        
        try {
            if (location === "server") {
                await api.delete(`/connections/delete?id=${encodeURIComponent(id)}`);
            } else {
                const localRaw = localStorage.getItem("db_manager_connections");
                if (localRaw) {
                    let localList: ServerConnection[] = JSON.parse(localRaw);
                    localList = localList.filter(c => c._id !== id);
                    localStorage.setItem("db_manager_connections", JSON.stringify(localList));
                }
            }
            if (expandedId === id) expandedId = null;
            await loadConnections();
        } catch (err: any) {
            alert("Failed to delete: " + err.message);
        }
    }

</script>

{#if appState.isConnectionManagerOpen}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div class="w-full max-w-4xl max-h-[85vh] bg-card border rounded-xl shadow-2xl flex flex-col overflow-hidden relative">
            <div class="flex items-center justify-between p-4 border-b bg-muted/30 shrink-0">
                <div class="flex items-center gap-2">
                    <Database class="w-5 h-5 text-primary" />
                    <h2 class="font-semibold text-lg">Connection Management</h2>
                </div>
                <button
                    class="p-2 hover:bg-muted rounded-full transition-colors"
                    onclick={() => (appState.isConnectionManagerOpen = false)}
                >
                    <X class="w-5 h-5 text-muted-foreground" />
                </button>
            </div>

            <div class="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-muted/10">
                {#if isLoading}
                    <div class="text-center text-muted-foreground p-8">Loading connections...</div>
                {:else if errorMsg}
                    <div class="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20">{errorMsg}</div>
                {:else if connections.length === 0}
                    <div class="text-center text-muted-foreground p-8">No saved connections found.</div>
                {:else}
                    {#each connections as conn (conn._id)}
                        <div class="bg-card border rounded-xl shadow-sm transition-all {expandedId === conn._id ? 'ring-2 ring-primary/20' : 'hover:border-primary/30'}">
                            <!-- Card Header -->
                            <div role="button" tabindex="0" class="flex items-center justify-between p-4 cursor-pointer" onclick={() => handleExpand(conn)} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleExpand(conn); }}>
                                <div class="flex items-center gap-4">
                                    <div class="p-2 bg-primary/10 rounded-lg">
                                        <Database class="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 class="font-semibold">{conn.user}@{conn.host}:{conn.port}</h3>
                                        <p class="text-xs text-muted-foreground mt-0.5">
                                            <span class="inline-block px-1.5 py-0.5 bg-secondary rounded mr-2 uppercase tracking-wide">{conn.engine}</span>
                                            {conn.database ? `DB: ${conn.database}` : 'No specific DB'} • {conn._location === 'server' ? 'Server Saved' : 'Local Saved'}
                                        </p>
                                    </div>
                                </div>
                                
                                <div class="flex items-center gap-2">
                                    <button 
                                        class="p-2 hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors text-muted-foreground"
                                        onclick={(e) => { e.stopPropagation(); deleteConnection(conn._id!, conn._location!); }}
                                        title="Delete Connection"
                                    >
                                        <Trash2 class="w-4 h-4" />
                                    </button>
                                    {#if expandedId === conn._id}
                                        <button 
                                            class="p-2 bg-secondary/50 hover:bg-secondary rounded-md transition-colors"
                                            onclick={(e) => { e.stopPropagation(); handleMinimize(); }}
                                            title="Minimize"
                                        >
                                            <ChevronUp class="w-4 h-4" />
                                        </button>
                                    {:else}
                                        <button 
                                            class="p-2 hover:bg-muted rounded-md transition-colors"
                                            onclick={(e) => { e.stopPropagation(); handleExpand(conn); }}
                                            title="Edit Connection"
                                        >
                                            <ChevronDown class="w-4 h-4 text-muted-foreground" />
                                        </button>
                                    {/if}
                                </div>
                            </div>

                            <!-- Expanded Form -->
                            {#if expandedId === conn._id}
                                <div class="p-5 border-t bg-background/50 flex flex-col gap-4">
                                    
                                    <div class="flex gap-2 p-1 bg-muted rounded-lg w-full max-w-xs mb-2">
                                        <button type="button" class="flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all {editState.engine === 'mysql' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:bg-background/50'}" onclick={() => editState.engine = "mysql"}>MySQL</button>
                                        <button type="button" class="flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all {editState.engine === 'postgresql' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:bg-background/50'}" onclick={() => editState.engine = "postgresql"}>PostgreSQL</button>
                                    </div>

                                    <div class="grid grid-cols-4 gap-4">
                                        <div class="col-span-3 flex flex-col gap-2">
                                            <label for="host-{conn._id}" class="text-sm font-medium">Host</label>
                                            <div class="relative">
                                                <Server class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <input id="host-{conn._id}" type="text" bind:value={editState.host} class="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm" placeholder="localhost" />
                                            </div>
                                        </div>
                                        <div class="col-span-1 flex flex-col gap-2">
                                            <label for="port-{conn._id}" class="text-sm font-medium">Port</label>
                                            <input id="port-{conn._id}" type="number" bind:value={editState.port} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="3306" />
                                        </div>
                                    </div>

                                    <div class="grid grid-cols-2 gap-4">
                                        <div class="flex flex-col gap-2">
                                            <label for="user-{conn._id}" class="text-sm font-medium">User</label>
                                            <input id="user-{conn._id}" type="text" bind:value={editState.user} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="root" />
                                        </div>
                                        <div class="flex flex-col gap-2">
                                            <label for="password-{conn._id}" class="text-sm font-medium">Password</label>
                                            <div class="relative">
                                                <Key class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <input id="password-{conn._id}" type="password" bind:value={editState.password} class="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm" placeholder="••••••••" />
                                            </div>
                                        </div>
                                    </div>

                                    <div class="flex flex-col gap-2">
                                        <label for="database-{conn._id}" class="text-sm font-medium">Database (Optional)</label>
                                        <input id="database-{conn._id}" type="text" bind:value={editState.database} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Database name" />
                                    </div>

                                    {#if conn._location === "server"}
                                        <div class="flex flex-col gap-2 pt-2">
                                            <label for="ipRestriction-{conn._id}" class="text-sm font-medium text-foreground">IP Restriction</label>
                                            <select id="ipRestriction-{conn._id}" bind:value={editState.ipRestriction} class="flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-1 text-sm">
                                                <option value="current">Only allow my current IP {currentIp ? `(${currentIp})` : ''}</option>
                                                <option value="selected">Allow specific IPs</option>
                                                <option value="all">Allow all IPs</option>
                                            </select>
                                            
                                            {#if editState.ipRestriction === 'selected'}
                                                <label for="specificIps-{conn._id}" class="text-sm font-medium text-muted-foreground mt-2">Specific IPs (comma separated)</label>
                                                <textarea id="specificIps-{conn._id}" bind:value={selectedIpsText} placeholder="192.168.1.1, 10.0.0.1" class="flex min-h-[60px] w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"></textarea>
                                            {/if}
                                        </div>
                                    {/if}

                                    <div class="flex justify-end gap-3 mt-4 pt-4 border-t">
                                        <button class="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors" onclick={handleMinimize}>Cancel</button>
                                        <button class="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors flex items-center gap-2" onclick={() => saveConnection(conn._id!)}>
                                            <Save class="w-4 h-4" /> Save Changes
                                        </button>
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {/each}
                {/if}
            </div>
        </div>
    </div>
{/if}
