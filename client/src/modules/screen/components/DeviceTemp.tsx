import { Device } from '../types'
import { DisconnectDeviceButton } from './DisconnectDeviceButton'
import { useScreen } from '../hooks/useScreen'
import { useWorkspace } from '@modules/workspace/hooks/useWorkspace'
import { useQuery } from '@tanstack/react-query'
import axios from '@config/axios'

const fetchTelemetry = async (workspaceId: string, screenId: string) => {
    const res = await axios.get(`/workspaces/${workspaceId}/screens/${screenId}/telemetry`)
    return res.data.telemetry
}

export const DeviceTemp = ({ device }: { device: Device }) => {
    const screen = useScreen()
    const workspace = useWorkspace()
    const isOnline = (device as any).isOnline ?? false
    const onlineAt = (device as any).onlineAt

    const { data: telemetry } = useQuery({
        queryKey: ['telemetry', screen.id],
        queryFn: () => fetchTelemetry(workspace.id, screen.id),
        refetchInterval: 30000,
    })

    const formatDate = (dateStr: string) => dateStr ? new Date(dateStr).toLocaleString() : '-'

    return (
        <>
            <div className='mt-10 flex items-center gap-5'>
                <div className='text-xl font-medium'>
                    Device
                </div>
                <DisconnectDeviceButton buttonText="Disconnect device" />
            </div>
            <div>
                Connection code
                <div>{ device.connectionCode }</div>
            </div>
            <div className='flex gap-5 flex-wrap mt-3'>
                <div>
                    <div>Status</div>
                    <div style={{ color: isOnline ? 'green' : 'gray' }}>
                        { isOnline ? 'Online' : 'Offline' }
                    </div>
                </div>
                <div>
                    <div>Last seen</div>
                    <div>{ formatDate(onlineAt) }</div>
                </div>
                { telemetry && (
                    <>
                        <div>
                            <div>Software</div>
                            <div>{ telemetry.softwareVersion } { telemetry.platform }</div>
                        </div>
                        <div>
                            <div>Timezone</div>
                            <div>{ telemetry.timezone }</div>
                        </div>
                        <div>
                            <div>Hostname</div>
                            <div>{ telemetry.hostname }</div>
                        </div>
                        <div>
                            <div>Local IP</div>
                            <div>{ telemetry.localIpAddress }</div>
                        </div>
                        <div>
                            <div>Public IP</div>
                            <div>{ telemetry.publicIpAddress }</div>
                        </div>
                        <div>
                            <div>MAC</div>
                            <div>{ telemetry.macAddress }</div>
                        </div>
                    </>
                )}
            </div>
        </>
    )
}
