import React, { useState, useEffect, useMemo } from 'react'
import { ChevronDown, Plus, User, Circle, AlertCircle } from 'lucide-react'
import './index.css'

const priorityNames = ['No priority', 'Low', 'Medium', 'High', 'Urgent']
const priorityIcons = [
  <Circle className="icon priority-no" />,
  <Circle className="icon priority-low" />,
  <Circle className="icon priority-medium" />,
  <Circle className="icon priority-high" />,
  <AlertCircle className="icon priority-urgent" />
]

export default function KanbanBoard() {
  const [tickets, setTickets] = useState([])
  const [users, setUsers] = useState([])
  const [grouping, setGrouping] = useState(() => localStorage.getItem('grouping') || 'status')
  const [ordering, setOrdering] = useState(() => localStorage.getItem('ordering') || 'priority')
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    fetch('https://api.quicksell.co/v1/internal/frontend-assignment')
      .then(response => response.json())
      .then(data => {
        setTickets(data.tickets)
        setUsers(data.users)
      })
  }, [])

  useEffect(() => {
    localStorage.setItem('grouping', grouping)
    localStorage.setItem('ordering', ordering)
  }, [grouping, ordering])


  const groupedAndSortedTickets = useMemo(() => {
    const grouped = tickets.reduce((acc, ticket) => {
      let key
      switch (grouping) {
        case 'status':
          key = ticket.status
          break
        case 'user':
          key = users.find(u => u.id === ticket.userId)?.name || 'Unassigned'
          break
        case 'priority':
          key = priorityNames[ticket.priority]
          break
        default:
          key = 'Other'
      }
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(ticket)
      return acc
    }, {} )

    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => {
        if (ordering === 'priority') {
          return b.priority - a.priority
        } else {
          return a.title.localeCompare(b.title)
        }
      })
    })

    return grouped
  }, [tickets, users, grouping, ordering])

  const getUserById = (id) => users.find(user => user.id === id)

  return (
    <div className="container">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
        <div className="dropdown">
          <button className="button button-outline" onClick={() => setShowDropdown(!showDropdown)}>
            Display <ChevronDown className="icon ml-2" />
          </button>
          <div className={`dropdown-content ${showDropdown ? 'show' : ''}`}>
            <div className="dropdown-label">Grouping</div>
            <div className="dropdown-separator"></div>
            <div className="dropdown-item" onClick={() => {
              setGrouping('status');
              setShowDropdown(false);
            }}>By Status</div>
            <div className="dropdown-item" onClick={() => {
              setGrouping('user');
              setShowDropdown(false);
            }}>By User</div>
            <div className="dropdown-item" onClick={() => {
              setGrouping('priority')
              setShowDropdown(false);
            }}>By Priority</div>
            <div className="dropdown-separator"></div>
            <div className="dropdown-label">Ordering</div>
            <div className="dropdown-separator"></div>
            <div className="dropdown-item" onClick={() => {
              setOrdering('priority');
              setShowDropdown(false);  
            }}>By Priority</div>
            <div className="dropdown-item" onClick={() =>{
              setOrdering('title');
              setShowDropdown(false);
            }}>By Title</div>
          </div>
        </div>
      </div>
      <div className="grid">
        {Object.entries(groupedAndSortedTickets).map(([group, groupTickets]) => (
          <div className="card" key={group}>
            <div className="card-header">
              <div className="card-title">
                {grouping === 'user' && <User className="icon" />}
                {grouping === 'priority' && priorityIcons[priorityNames.indexOf(group)]}
                <span className="ml-2">{group}</span>
                <span className="ml-2">({groupTickets.length})</span>
              </div>
              <button className="button button-ghost button-icon">
                <Plus className="icon" />
                <span className="sr-only">Add ticket</span>
              </button>
            </div>
            <div className="card-content">
              {groupTickets.map((ticket) => {
                const user = getUserById(ticket.userId)
                return (
                  <div className="card" key={ticket.id}>
                    <div className="card-header">
                      <span>{ticket.id}</span>
                      {user && (
                        <div className="avatar">{user.name.split(' ').map(n => n[0]).join('')}</div>
                      )}
                    </div>
                    <div className="card-content">
                      <p>{ticket.title}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        {grouping !== 'priority' && (
                          <span className="badge badge-secondary">
                            {priorityIcons[ticket.priority]}
                            <span>{priorityNames[ticket.priority]}</span>
                          </span>
                        )}
                        {ticket.tag.map((tag, index) => (
                          <span key={index} className="badge badge-outline">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}