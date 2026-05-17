
async function api(path, options) {
  try {
    const res = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...(options && options.headers ? options.headers : {}),
      },
    });
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { res, data };
  } catch (error) {
    console.error('API request failed:', error);
    return { res: { ok: false }, data: { error: 'Network error' } };
  }
}

async function checkAuth() {
  try {
    const { res, data } = await api('/api/auth/me', { method: 'GET' });
    if (!res.ok || !data.user) {
      return null;
    }
    return data.user;
  } catch (error) {
    console.error('Auth check failed:', error);
    return null;
  }
}

async function loadEvents() {
  try {
    const { res, data } = await api('/api/events', { method: 'GET' });
    if (!res.ok) {
      throw new Error(data?.error || 'Failed to load events');
    }
    return data || [];
  } catch (error) {
    console.error('Error loading events:', error);
    throw error;
  }
}

async function createEvent(eventData) {
  try {
    const { res, data } = await api('/api/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
    if (!res.ok) {
      throw new Error(data?.error || 'Failed to create event');
    }
    return data;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

async function joinEvent(eventId) {
  try {
    const { res, data } = await api(`/api/events/${encodeURIComponent(eventId)}/join`, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error(data?.error || 'Failed to join event');
    }
    return data;
  } catch (error) {
    console.error('Error joining event:', error);
    throw error;
  }
}


function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(dateStr) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function renderEventCard(event) {
  return `
    <div class="card" style="padding: 1.5rem; display: flex; gap: 1.5rem;">
      <div style="flex: 1;">
        <h3 style="margin: 0 0 0.5rem;">${escapeHtml(event.name || 'Unnamed Event')}</h3>
        <p style="color: #666; margin: 0 0 1rem; font-size: 14px;">${escapeHtml(event.description || '')}</p>
        <div style="color: #666; font-size: 14px; line-height: 1.6;">
          <div>📅 ${formatDate(event.date || '')}</div>
          <div>🕐 ${escapeHtml(event.time || 'TBA')}</div>
          <div>📍 ${escapeHtml(event.location || 'TBA')}</div>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between;">
        <div style="text-align: center; background: #f0f0f0; padding: 1rem; border-radius: 8px; min-width: 100px;">
          <div style="font-size: 24px; font-weight: bold; color: #111;">${event.attending || 0}</div>
          <div style="color: #666; font-size: 12px; margin-top: 0.25rem;">Attending</div>
        </div>
        <button class="join-event-btn chip" type="button" data-event-id="${event.id}" style="background: #111; color: #fff; border: none; cursor: pointer; padding: 8px 16px; border-radius: 20px; font-weight: 600;">
          Join Event
        </button>
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = await checkAuth();
  const eventsContainer = document.querySelector('[data-events-container]');
  const createForm = document.getElementById('create-event-form');
  const logoutBtn = document.getElementById('logout-button');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await api('/api/auth/logout', { method: 'POST' });
        window.location.reload();
      } catch (error) {
        console.error('Logout error:', error);
        window.location.reload();
      }
    });
  }

  // Load and display events
  try {
    const events = await loadEvents();
    if (eventsContainer) {
      eventsContainer.innerHTML = events.map(e => renderEventCard(e)).join('');
      
      // Add event listeners to join buttons
      eventsContainer.querySelectorAll('.join-event-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!user) {
            window.location.href = '/pages/login.html';
            return;
          }
          try {
            const eventId = btn.getAttribute('data-event-id');
            await joinEvent(eventId);
            window.location.reload();
          } catch (error) {
            console.error('Error joining event:', error);
            alert('Failed to join event: ' + error.message);
          }
        });
      });
    }
  } catch (error) {
    console.error('Failed to load events:', error);
    if (eventsContainer) {
      eventsContainer.innerHTML = `<p style="color: var(--danger);">Error loading events: ${escapeHtml(error.message)}</p>`;
    }
  }

  // Handle event creation
  if (createForm && user) {
    createForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const formData = new FormData(createForm);
        const eventData = {
          name: formData.get('name'),
          date: formData.get('date'),
          time: formData.get('time'),
          location: formData.get('location'),
          attending: parseInt(formData.get('attending')) || 0,
          description: formData.get('description'),
        };

        await createEvent(eventData);
        createForm.reset();
        // Reload events
        window.location.reload();
      } catch (error) {
        console.error('Error creating event:', error);
        alert('Failed to create event: ' + error.message);
      }
    });
  } else if (createForm) {
    createForm.style.display = 'none';
  }
});
