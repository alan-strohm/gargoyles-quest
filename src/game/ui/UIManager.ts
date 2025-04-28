import { Power } from '../entities/Player';

interface UIState {
    playerHealth: number;
    playerCoins: number;
    activePowers: Power[];
}

export class UIManager {
    private statsElement: HTMLElement;
    private inventoryElement: HTMLElement;
    private powersElement: HTMLElement;

    constructor() {
        this.statsElement = document.getElementById('player-stats')!;
        this.inventoryElement = document.getElementById('inventory')!;
        this.powersElement = document.getElementById('powers')!;
    }

    public initialize(): void {
        this.createStatsUI();
        this.createInventoryUI();
        this.createPowersUI();
    }

    public update(state: UIState): void {
        this.updateStats(state);
        this.updateInventory();
        this.updatePowers();
    }

    private createStatsUI(): void {
        this.statsElement.innerHTML = `
            <div class="stat-item">
                <label>Health:</label>
                <div id="health-bar">
                    <div id="health-fill"></div>
                </div>
            </div>
            <div class="stat-item">
                <label>Coins:</label>
                <span id="coins-value">0</span>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .stat-item {
                margin: 10px 0;
                color: white;
            }
            #health-bar {
                width: 100%;
                height: 20px;
                background: #444;
                border-radius: 10px;
                overflow: hidden;
            }
            #health-fill {
                width: 100%;
                height: 100%;
                background: #e74c3c;
                transition: width 0.3s ease;
            }
            #coins-value {
                font-weight: bold;
                color: #f1c40f;
            }
        `;
        document.head.appendChild(style);
    }

    private createInventoryUI(): void {
        this.inventoryElement.innerHTML = `
            <div id="inventory-grid"></div>
        `;
    }

    private createPowersUI(): void {
        this.powersElement.innerHTML = `
            <div id="powers-list"></div>
        `;
    }

    private updateStats(state: UIState): void {
        const healthFill = document.getElementById('health-fill')!;
        const coinsValue = document.getElementById('coins-value')!;

        healthFill.style.width = `${state.playerHealth}%`;
        coinsValue.textContent = state.playerCoins.toString();
    }

    private updateInventory(): void {
        // Update inventory items when implemented
    }

    private updatePowers(): void {
        const powersList = document.getElementById('powers-list')!;
        powersList.innerHTML = ''; // Clear the list for now
    }
} 