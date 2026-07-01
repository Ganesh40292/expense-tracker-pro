import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaSearch,
  FaFilter,
  FaTrashAlt,
  FaUserEdit,
  FaToggleOn,
  FaToggleOff,
  FaEye,
  FaDownload,
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa'
import {
  getUsersList,
  changeUserRole,
  changeUserStatus,
  deleteUser,
} from '../../services/adminService'
import {
  exportUsersPDF,
  exportUsersExcel,
  exportUsersCSV,
} from '../../services/adminExportService'
import Loader from '../../components/Loader/Loader'
import Modal from '../../components/Modal/Modal'
import './Admin.css'

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [size] = useState(10)
  const [sortBy, setSortBy] = useState('id')
  const [sortDir, setSortDir] = useState('asc')
  
  // Modal states for delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Export states
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getUsersList({
        search,
        role: roleFilter,
        enabled: statusFilter,
        page,
        size,
        sortBy,
        sortDir,
      })
      setUsers(data.content || [])
      setTotalElements(data.totalElements || 0)
      setTotalPages(data.totalPages || 0)
    } catch (err) {
      console.error('Failed to load user directory', err)
    } finally {
      setLoading(false)
    }
  }, [search, roleFilter, statusFilter, page, size, sortBy, sortDir])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSearchChange = (e) => {
    setSearch(e.target.value)
    setPage(0) // Reset to first page
  }

  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value)
    setPage(0)
  }

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value)
    setPage(0)
  }

  const handleRoleChange = async (id, newRole) => {
    try {
      await changeUserRole(id, newRole)
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u))
    } catch (err) {
      console.error('Failed to update role', err)
    }
  }

  const handleStatusToggle = async (id, currentStatus) => {
    try {
      const nextStatus = !currentStatus
      await changeUserStatus(id, nextStatus)
      setUsers(prev => prev.map(u => u.id === id ? { ...u, enabled: nextStatus } : u))
    } catch (err) {
      console.error('Failed to toggle user status', err)
    }
  }

  const handleDeleteTrigger = (user) => {
    setUserToDelete(user)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return
    try {
      setDeleting(true)
      await deleteUser(userToDelete.id)
      setDeleteConfirmOpen(false)
      setUserToDelete(null)
      fetchUsers() // Refresh list
    } catch (err) {
      console.error('Failed to delete user', err)
    } finally {
      setDeleting(false)
    }
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDir('asc')
    }
    setPage(0)
  }

  const handleExport = async (format) => {
    setExportDropdownOpen(false)
    try {
      setExporting(true)
      // Fetch ALL users for export
      const allData = await getUsersList({
        search,
        role: roleFilter,
        enabled: statusFilter,
        page: 0,
        size: 99999, // Large size to fetch everyone matching filters
        sortBy,
        sortDir,
      })
      const exportList = allData.content || []
      
      if (format === 'pdf') {
        exportUsersPDF(exportList)
      } else if (format === 'excel') {
        await exportUsersExcel(exportList)
      } else if (format === 'csv') {
        exportUsersCSV(exportList)
      }
    } catch (err) {
      console.error('Export failed', err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">User Directory</h1>
          <p className="admin-subtitle">Inspect profiles, edit role permissions, and toggle access states</p>
        </div>

        {/* Export Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className="action-btn action-btn--primary"
            onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
            disabled={exporting}
          >
            <FaDownload size={14} />
            <span>{exporting ? 'Exporting...' : 'Export Directory'}</span>
          </button>
          
          <AnimatePresence>
            {exportDropdownOpen && (
              <motion.div
                className="export-dropdown glass-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <button onClick={() => handleExport('pdf')}>PDF Format</button>
                <button onClick={() => handleExport('excel')}>Excel Spreadsheet</button>
                <button onClick={() => handleExport('csv')}>CSV Format</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="filter-panel glass-card">
        <div className="search-bar-wrapper">
          <FaSearch className="search-bar-icon" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={handleSearchChange}
            className="search-bar-input"
          />
        </div>

        <div className="filters-wrapper">
          <div className="select-wrapper">
            <FaFilter className="select-icon" />
            <select value={roleFilter} onChange={handleRoleFilterChange} className="select-filter">
              <option value="">All Roles</option>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
              <option value="MODERATOR">Moderator</option>
              <option value="SUPPORT">Support</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>

          <div className="select-wrapper">
            <select value={statusFilter} onChange={handleStatusFilterChange} className="select-filter">
              <option value="">All Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Deactivated Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <Loader />
      ) : (
        <div className="glass-card table-card">
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('id')} className="sortable-th">
                    ID {sortBy === 'id' && (sortDir === 'asc' ? '▲' : '▼')}
                  </th>
                  <th onClick={() => handleSort('name')} className="sortable-th">
                    Name {sortBy === 'name' && (sortDir === 'asc' ? '▲' : '▼')}
                  </th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Tracked Items</th>
                  <th>Last Session</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map(u => (
                    <tr key={u.id}>
                      <td>#{u.id}</td>
                      <td>
                        <div className="user-info-cell">
                          <span className="user-cell-name">{u.name}</span>
                          <span className="user-cell-email">{u.email}</span>
                        </div>
                      </td>
                      <td>
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="table-role-select"
                        >
                          <option value="USER">User</option>
                          <option value="ADMIN">Admin</option>
                          <option value="MODERATOR">Moderator</option>
                          <option value="SUPPORT">Support</option>
                          <option value="SUPER_ADMIN">Super Admin</option>
                        </select>
                      </td>
                      <td>
                        <span className={`status-pill ${u.enabled ? 'status-pill--active' : 'status-pill--inactive'}`}>
                          {u.enabled ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td>{u.transactionCount} transactions</td>
                      <td>
                        <span className="table-time-cell">
                          {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never logged in'}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <Link to={`/admin/users/${u.id}`} className="table-action-btn action-view" title="View details">
                            <FaEye size={12} />
                          </Link>
                          
                          <button
                            onClick={() => handleStatusToggle(u.id, u.enabled)}
                            className={`table-action-btn ${u.enabled ? 'action-toggle-on' : 'action-toggle-off'}`}
                            title={u.enabled ? 'Deactivate account' : 'Reactivate account'}
                          >
                            {u.enabled ? <FaToggleOn size={16} /> : <FaToggleOff size={16} />}
                          </button>
                          
                          <button
                            onClick={() => handleDeleteTrigger(u)}
                            className="table-action-btn action-delete"
                            title="Delete User"
                          >
                            <FaTrashAlt size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="empty-table-cell">
                      No accounts found matching search/filter rules
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="table-pagination">
              <span className="pagination-info">
                Showing Page {page + 1} of {totalPages} ({totalElements} users total)
              </span>
              <div className="pagination-controls">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="pagination-btn"
                >
                  <FaChevronLeft size={10} />
                </button>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  className="pagination-btn"
                >
                  <FaChevronRight size={10} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete User Account"
      >
        <div className="delete-modal-content">
          <p>
            Are you absolutely sure you want to delete <strong>{userToDelete?.name}</strong> (
            {userToDelete?.email})?
          </p>
          <div className="modal-alert-box alert-danger">
            <strong>WARNING:</strong> This will permanently delete this user, all of their tracked transactions, recurring expenses, email logs, preferences, and login audit trails. This operation cannot be undone.
          </div>
          <div className="modal-actions-panel">
            <button
              onClick={() => setDeleteConfirmOpen(false)}
              className="action-btn action-btn--secondary"
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="action-btn action-btn--danger"
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Permanently Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default UserManagement
