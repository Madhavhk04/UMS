/**
 * Faculty Dashboard Logic
 */

// ==================== GLOBAL HELPERS ====================

// URLs will be set from the template
let FACULTY_URLS = {
    classes: '',
    assignments: '',
    reports: '',
    markAttendanceBase: '',
    saveAttendance: '',
    addAssignment: '',
    editAssignmentBase: '',
    deleteAssignmentBase: '',
    studentDetailBase: ''
};

function initFacultyDashboard(urls) {
    FACULTY_URLS = { ...FACULTY_URLS, ...urls };
}

function openPopup(type) {
    const modal = document.getElementById('popupModal');
    const modalBody = document.getElementById('modalBody');

    modal.style.display = 'block';
    modalBody.innerHTML = '<div style="text-align:center; padding:40px;"><i class="fas fa-spinner fa-spin" style="font-size:48px;color:#667eea;"></i><p>Loading...</p></div>';

    let url = '';
    if (type === 'classes') {
        url = FACULTY_URLS.classes;
    } else if (type === 'assignments') {
        url = FACULTY_URLS.assignments;
    } else if (type === 'reports') {
        url = FACULTY_URLS.reports;
    }

    fetch(url)
        .then(response => response.text())
        .then(html => {
            modalBody.innerHTML = html;
        })
        .catch(error => {
            console.error('Error:', error);
            modalBody.innerHTML = '<div style="text-align:center; padding:40px; color:red;"><i class="fas fa-exclamation-triangle"></i><p>Error loading content</p></div>';
        });
}

function closePopup() {
    document.getElementById('popupModal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('popupModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// ==================== ATTENDANCE LOGIC ====================

function markAttendance(subjectId) {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = '<div style="text-align:center; padding:40px;"><i class="fas fa-spinner fa-spin" style="font-size:48px;color:#667eea;"></i><p>Loading...</p></div>';

    fetch(`${FACULTY_URLS.markAttendanceBase}/${subjectId}`)
        .then(response => response.text())
        .then(html => {
            modalBody.innerHTML = html;
            updateCount(); // Initialize count
        });
}

function updateAttendanceStatus(studentId, status) {
    const checkbox = document.getElementById(`chk_${studentId}`);
    const btnAbsent = document.getElementById(`btn_absent_${studentId}`);
    const btnPresent = document.getElementById(`btn_present_${studentId}`);

    if (status === 'present') {
        checkbox.checked = true;
        btnPresent.classList.add('active');
        btnAbsent.classList.remove('active');
    } else {
        checkbox.checked = false;
        btnAbsent.classList.add('active');
        btnPresent.classList.remove('active');
    }
    updateCount();
}

function updateCount() {
    const checkboxes = document.querySelectorAll('input[name="attended[]"]');
    const checked = document.querySelectorAll('input[name="attended[]"]:checked').length;
    const countDisplay = document.getElementById('countDisplay');
    if (countDisplay) countDisplay.textContent = checked;
}

function selectAll(status) {
    const checkboxes = document.querySelectorAll('input[name="attended[]"]');
    checkboxes.forEach(cb => {
        const studentId = cb.value;
        updateAttendanceStatus(studentId, status);
    });
}

function confirmAttendance() {
    const checked = document.querySelectorAll('input[name="attended[]"]:checked').length;
    const total = document.querySelectorAll('input[name="attended[]"]').length;

    return confirm(`Mark attendance for ${checked} present out of ${total} students?`);
}

// ==================== ASSIGNMENT LOGIC ====================

function toggleAddForm() {
    const form = document.getElementById('addAssignmentForm');
    if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function editAssignment(id) {
    // Hide all other edit forms
    document.querySelectorAll('.edit-form').forEach(form => {
        form.style.display = 'none';
    });

    // Show this edit form
    const editForm = document.getElementById('edit-form-' + id);
    if (editForm) editForm.style.display = 'block';
}

function cancelEdit(id) {
    const editForm = document.getElementById('edit-form-' + id);
    if (editForm) editForm.style.display = 'none';
}

async function handleAssignmentSubmit(event, form) {
    event.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;

    try {
        const response = await fetch(form.action, {
            method: 'POST',
            body: new FormData(form)
        });

        if (response.ok) {
            const html = await response.text();
            document.getElementById('modalBody').innerHTML = html;
            alert('Action completed successfully!');
        } else {
            alert('Error performing operation. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please check your connection.');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function deleteAssignment(id, title) {
    if (confirm(`Are you sure you want to delete "${title}"?\n\nThis action cannot be undone and will remove the assignment for all students.`)) {
        // Use AJAX instead of form submit to prevent redirect to partial page
        fetch(`${FACULTY_URLS.deleteAssignmentBase}/${id}`, {
            method: 'POST'
        })
            .then(response => {
                if (response.ok) {
                    return response.text();
                }
            })
            .then(html => {
                if (html) {
                    document.getElementById('modalBody').innerHTML = html;
                    alert('Assignment deleted successfully!');
                } else {
                    alert('Error deleting assignment');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error deleting assignment');
            });
    }
}

// ==================== REPORT LOGIC ====================

function searchStudents() {
    const input = document.getElementById('searchInput');
    if (!input) return;
    const filter = input.value.toUpperCase();
    const table = document.getElementById('studentsTable');
    const tr = table.getElementsByTagName('tr');

    for (let i = 1; i < tr.length; i++) {
        const row = tr[i];
        const cells = row.getElementsByTagName('td');
        let found = false;

        for (let j = 0; j < cells.length - 1; j++) {
            const cell = cells[j];
            if (cell) {
                const textValue = cell.textContent || cell.innerText;
                if (textValue.toUpperCase().indexOf(filter) > -1) {
                    found = true;
                    break;
                }
            }
        }

        row.style.display = found ? '' : 'none';
    }
}

function viewStudentDetail(studentId) {
    const modalBody = document.getElementById('modalBody');
    fetch(`${FACULTY_URLS.studentDetailBase}/${studentId}`)
        .then(response => response.text())
        .then(html => {
            modalBody.innerHTML = html;
        });
}
