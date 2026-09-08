<script lang="ts">
    import { appState } from "$lib/state.svelte";
    import { Settings, Download, Upload, Copy, Trash2, Database, Table2, Server, ChevronDown } from "@lucide/svelte";
    import { socket } from "$lib/services/socket";
    import { onMount } from "svelte";
    import ExportModal from "./ExportModal.svelte";
    import ImportModal from "./ImportModal.svelte";

    let isOpen = $state(false);
    let menuRef: HTMLDivElement;

    // Modals
    let showExportModal = $state(false);
    let showImportModal = $state(false);

    // Derived current level
    let currentLevel = $derived(
        appState.currentTable ? 'table' : 
        appState.currentDatabase ? 'database' : 'server'
    );

    // Action handlers
    function duplicateDatabase(db: string) { 
        const newName = prompt(`Enter new name for database '${db}':`);
        if (newName && newName !== db) socket.emit("duplicate_database", { database: db, newDatabase: newName });
    }
    function dropDatabase(db: string) { 
        if(confirm(`Drop database '${db}'? This cannot be undone.`)) {
            socket.emit("drop_database", db);
            appState.currentDatabase = null;
            appState.currentTable = null;
        }
    }
    function duplicateTable(db: string, table: string) { 
        const newName = prompt(`Enter new name for table '${table}':`);
        if (newName && newName !== table) socket.emit("duplicate_table", { database: db, table, newTable: newName });
    }
    function truncateTable(db: string, table: string) { 
        if(confirm(`Empty all data in '${table}'?`)) socket.emit("truncate_table", { database: db, table }); 
    }
    function dropTable(db: string, table: string) { 
        if(confirm(`Drop table '${table}'? This cannot be undone.`)) {
            socket.emit("drop_table", { database: db, table });
            appState.currentTable = null;
        }
    }

    function handleExport(level: 'server' | 'database' | 'table', db: string | null, tbl: string | null, options: any) {
        if (level === 'server') {
            socket.emit("export_server", { options }); 
        } else if (level === 'table' && db && tbl) {
            socket.emit("export_table", { database: db, table: tbl, options });
        } else if (level === 'database' && db) {
            socket.emit("export_database", { database: db, options });
        }
    }

    // Close on click outside
    function handleClickOutside(event: MouseEvent) {
        if (isOpen && menuRef && !menuRef.contains(event.target as Node)) {
            isOpen = false;
        }
    }

    onMount(() => {
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    });
</script>

<div class="relative" bind:this={menuRef}>
    <button 
        class="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 hover:bg-secondary text-secondary-foreground rounded-md text-sm font-medium transition-colors"
        onclick={(e) => { e.stopPropagation(); isOpen = !isOpen; }}
    >
        <Settings size={16} />
        Options
        <ChevronDown size={14} class="opacity-50" />
    </button>

    {#if isOpen}
        <div class="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-56 bg-card border rounded-md shadow-lg z-50 py-1 text-sm">
            <div class="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b mb-1 flex items-center gap-2">
                {#if currentLevel === 'table'}
                    <Table2 size={14} /> Table: {appState.currentTable}
                {:else if currentLevel === 'database'}
                    <Database size={14} /> DB: {appState.currentDatabase}
                {:else}
                    <Server size={14} /> Server Actions
                {/if}
            </div>

            <button class="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center gap-2" onclick={() => { showExportModal = true; isOpen = false; }}>
                <Download size={16} /> Export...
            </button>
            <button class="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center gap-2" onclick={() => { showImportModal = true; isOpen = false; }}>
                <Upload size={16} /> Import...
            </button>

            {#if currentLevel === 'database' || currentLevel === 'table'}
                <div class="my-1 border-t"></div>
            {/if}

            {#if currentLevel === 'table'}
                <button class="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center gap-2" onclick={() => { duplicateTable(appState.currentDatabase!, appState.currentTable!); isOpen = false; }}>
                    <Copy size={16} /> Duplicate Table
                </button>
                <button class="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center gap-2 text-destructive" onclick={() => { truncateTable(appState.currentDatabase!, appState.currentTable!); isOpen = false; }}>
                    <Trash2 size={16} /> Empty Data
                </button>
                <button class="w-full text-left px-3 py-2 hover:bg-destructive/10 transition-colors flex items-center gap-2 text-destructive" onclick={() => { dropTable(appState.currentDatabase!, appState.currentTable!); isOpen = false; }}>
                    <Trash2 size={16} /> Drop Table
                </button>
            {/if}

            {#if currentLevel === 'database'}
                <button class="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center gap-2" onclick={() => { duplicateDatabase(appState.currentDatabase!); isOpen = false; }}>
                    <Copy size={16} /> Duplicate Database
                </button>
                <button class="w-full text-left px-3 py-2 hover:bg-destructive/10 transition-colors flex items-center gap-2 text-destructive" onclick={() => { dropDatabase(appState.currentDatabase!); isOpen = false; }}>
                    <Trash2 size={16} /> Drop Database
                </button>
            {/if}
        </div>
    {/if}
</div>

<ExportModal 
    show={showExportModal} 
    initialDatabase={appState.currentDatabase}
    initialTable={appState.currentTable}
    onClose={() => showExportModal = false}
    onExport={handleExport}
/>

{#if showImportModal}
<ImportModal
    show={showImportModal}
    onClose={() => showImportModal = false}
/>
{/if}
