import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import TableLanding from './pages/TableLanding';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import Payment from './pages/Payment';
import OrderTracking from './pages/OrderTracking';
import Login from './pages/admin/Login';
import AdminLayout from './pages/admin/AdminLayout';
import MenuManagement from './pages/admin/MenuManagement';
import TableManagement from './pages/admin/TableManagement';
import Orders from './pages/admin/Orders';
import Analytics from './pages/admin/Analytics';
import KitchenDashboard from './pages/kitchen/Dashboard';
import CustomerLayout from './components/CustomerLayout';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
    const { user, token } = useAuthStore();
    if (!token || !user) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
    return <>{children}</>;
}

export default function App() {
    return (
        <Routes>
            <Route element={<CustomerLayout />}>
                <Route path="/t/:tableId" element={<TableLanding />} />
                <Route path="/menu/:tableId" element={<Menu />} />
                <Route path="/cart/:tableId" element={<Cart />} />
                <Route path="/payment/:orderId" element={<Payment />} />
                <Route path="/order/:orderId" element={<OrderTracking />} />
            </Route>
            <Route path="/login" element={<Login />} />
            <Route path="/kitchen" element={<ProtectedRoute allowedRoles={['admin', 'kitchen']}><KitchenDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/admin/menu" replace />} />
                <Route path="menu" element={<MenuManagement />} />
                <Route path="tables" element={<TableManagement />} />
                <Route path="orders" element={<Orders />} />
                <Route path="analytics" element={<Analytics />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}
