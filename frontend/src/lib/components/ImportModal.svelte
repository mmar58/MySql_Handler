<script lang="ts">
    import { appState, addNotification, updateNotification } from "$lib/state.svelte";
    import { X, Upload, File as FileIcon } from "@lucide/svelte";
    import { scale, fade } from "svelte/transition";
    import { socket } from "$lib/services/socket";

    export let show: boolean;
    export let onClose: () => void;

    let targetLevel: 'server' | 'database' | 'table' = 'server';
    let selectedDb: string | null = null;
    let selectedTable: string | null = null;
    let fileInput: HTMLInputElement;
    let selectedFile: File | null = null;
    let isImporting = false;

    $: if (show) {
        selectedDb = appState.currentDatabase;
        selectedTable = appState.currentTable;
        if (selectedTable && selectedDb) {
            targetLevel = 'table';
        } else if (selectedDb) {
            targetLevel = 'database';
        } else {
            targetLevel = 'server';
        }
    }

    function handleFileSelect(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
            selectedFile = file;
        }
    }

    function handleImport() {
        if (!selectedFile) return;

        isImporting = true;
        const reader = new FileReader();
        
        // Add notification
        const notifId = addNotification({
            type: 'info',
            title: `Importing ${selectedFile.name}`,
            message: 'Reading file...',
            isIndeterminate: true,
            autoClose: false
        });

        reader.onprogress = (ev) => {
            if (ev.lengthComputable) {
                const percent = Math.round((ev.loaded / ev.total) * 100);
                updateNotification(notifId, {
                    message: `Reading file... ${percent}%`,
                    progress: percent,
                    isIndeterminate: false
                });
            }
        };

        reader.onload = (ev) => {
            const content = ev.target?.result as string;
            const type = selectedFile!.name.endsWith('.json') ? 'json' : 'sql';
            
            updateNotification(notifId, {
                message: 'Sending to server...',
                isIndeterminate: true,
                progress: undefined
            });

            try {
                if (targetLevel === 'table' && selectedDb && selectedTable) {
                    socket.emit('import_table', { database: selectedDb, table: selectedTable, content, type });
                } else if (targetLevel === 'database' && selectedDb) {
                    socket.emit('import_database', { database: selectedDb, content, type });
                } else {
                    if (selectedDb) {
                        socket.emit('import_database', { database: selectedDb, content, type });
                    } else {
                        updateNotification(notifId, { type: 'error', message: 'Server level import requires a selected database currently.', isIndeterminate: false, autoClose: true });
                        isImporting = false;
                        return;
                    }
                }
                
                updateNotification(notifId, {
                    type: 'success',
                    title: `Import Complete`,
                    message: `${selectedFile.name} imported successfully.`,
                    isIndeterminate: false,
                    autoClose: true
                });
            } catch (err) {
                updateNotification(notifId, {
                    type: 'error',
                    title: `Import Failed`,
                    message: String(err),
                    isIndeterminate: false,
                    autoClose: true
                });
            }

            isImporting = false;
            onClose();
            selectedFile = null;
        };
        
        reader.onerror = () => {
            updateNotification(notifId, {
                type: 'error',
                title: `Import Failed`,
                message: 'Failed to read file',
                isIndeterminate: false,
                autoClose: true
            });
            isImporting = false;
            onClose();
        };

        reader.readAsText(selectedFile);
    }
</script>

{#if show}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" transition:fade={{ duration: 150 }}>
        <div class="bg-card border shadow-lg rounded-lg w-full max-w-md overflow-hidden" transition:scale={{ duration: 150, start: 0.95 }}>
            <div class="flex items-center justify-between p-4 border-b">
                <h2 class="text-lg font-semibold flex items-center gap-2">
                    <Upload size={20} class="text-primary"/>
                    Import Data
                </h2>
                <button class="p-1 hover:bg-muted rounded-md transition-colors" onclick={onClose} disabled={isImporting}>
                    <X size={20} />
                </button>
            </div>
            
            <div class="p-4 flex flex-col gap-4">
                <div class="space-y-1">
                    <label for="import-target" class="text-sm font-medium">Import Target</label>
                    <div class="flex gap-2">
                        <select id="import-target" class="flex-1 bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" bind:value={targetLevel} disabled={isImporting}>
                            <option value="server">Entire Server</option>
                            <option value="database" disabled={!selectedDb}>Database: {selectedDb || 'None selected'}</option>
                            <option value="table" disabled={!selectedTable}>Table: {selectedTable || 'None selected'}</option>
                        </select>
                    </div>
                </div>

                <div class="space-y-1">
                    <label class="text-sm font-medium">File to Import</label>
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div 
                        class="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer"
                        onclick={() => !isImporting && fileInput.click()}
                    >
                        <Upload size={24} class="text-muted-foreground mb-2" />
                        {#if selectedFile}
                            <span class="text-sm font-medium text-primary">{selectedFile.name}</span>
                            <span class="text-xs text-muted-foreground">({(selectedFile.size / 1024).toFixed(2)} KB)</span>
                        {:else}
                            <span class="text-sm font-medium">Click to select file</span>
                            <span class="text-xs text-muted-foreground">Supports .sql, .json, .zip</span>
                        {/if}
                    </div>
                    <input type="file" bind:this={fileInput} onchange={handleFileSelect} accept=".sql,.json,.zip" class="hidden" />
                </div>
            </div>

            <div class="flex items-center justify-end gap-2 p-4 border-t bg-muted/20">
                <button class="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors" onclick={onClose} disabled={isImporting}>
                    Cancel
                </button>
                <button class="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2" onclick={handleImport} disabled={!selectedFile || isImporting}>
                    {#if isImporting}
                        <div class="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                        Importing...
                    {:else}
                        Import
                    {/if}
                </button>
            </div>
        </div>
    </div>
{/if}
