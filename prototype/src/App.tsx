import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import NowScreen from './screens/NowScreen'
import InboxScreen from './screens/InboxScreen'
import OwnedScreen from './screens/OwnedScreen'
import ReviewScreen from './screens/ReviewScreen'
import FleetScreen from './screens/FleetScreen'
import PlanScreen from './screens/PlanScreen'
import IncidentScreen from './screens/IncidentScreen'
import EscalationScreen from './screens/EscalationScreen'
import Landing from './screens/Landing'
import Specimen from './screens/Specimen'
import Gallery from './screens/Gallery'
import IosApp from './surfaces/ios/IosApp'
import VehicleApp from './surfaces/vehicle/VehicleApp'

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/now" element={<NowScreen />} />
          <Route path="/inbox" element={<InboxScreen />} />
          <Route path="/owned" element={<OwnedScreen />} />
          <Route path="/review" element={<ReviewScreen />} />
          <Route path="/fleet" element={<FleetScreen />} />
          <Route path="/plan" element={<PlanScreen />} />
          <Route path="/incidents/:id" element={<IncidentScreen />} />
          <Route path="/escalations/:id" element={<EscalationScreen />} />
          <Route path="/gallery" element={<Gallery />} />
        </Route>
        <Route path="/" element={<Landing />} />
        <Route path="/specimen" element={<Specimen />} />
        {/* Other surfaces render outside the desktop shell; each owns its nested routes. */}
        <Route path="/ios/*" element={<IosApp />} />
        <Route path="/vehicle/*" element={<VehicleApp />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
