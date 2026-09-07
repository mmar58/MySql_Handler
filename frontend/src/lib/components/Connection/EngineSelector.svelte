<script lang="ts">
    /** Bound selected database engine */
    export let engine: "mysql" | "postgresql" = "mysql";
    /** Optional callback when engine is changed */
    export let onChange: (e: "mysql" | "postgresql") => void = () => {};

    function setEngine(e: "mysql" | "postgresql") {
        engine = e;
        onChange(e);
    }
</script>

<div class="flex gap-2 p-1 bg-muted rounded-lg w-full">
    <button
        type="button"
        class="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all {engine === 'mysql' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:bg-background/50'}"
        onclick={() => setEngine("mysql")}
    >
        MySQL
    </button>
    <button
        type="button"
        class="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all {engine === 'postgresql' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:bg-background/50'}"
        onclick={() => setEngine("postgresql")}
    >
        PostgreSQL
    </button>
</div>
