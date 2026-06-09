export type DeviceProps = {
    id: string
    screenId: string | null
    token: string
    connectionCode: string
    createdAt: Date
    updatedAt: Date
    onlineAt: Date
}

export class Device {
    public readonly id: string
    public screenId: string | null
    public readonly token: string
    public readonly connectionCode: string
    public readonly createdAt: Date
    public updatedAt: Date
    public onlineAt: Date

    constructor(props: DeviceProps) {
        this.id = props.id
        this.screenId = props.screenId
        this.token = props.token
        this.connectionCode = props.connectionCode
        this.createdAt = props.createdAt
        this.updatedAt = props.updatedAt
        this.onlineAt = props.onlineAt
    }

    connectToScreen(screenId: string): void {
        this.screenId = screenId
    }

    disconnectFromScreen(): void {
        this.screenId = null
    }

    markOnline(): void {
        this.onlineAt = new Date()
        this.updatedAt = new Date()
    }
}
