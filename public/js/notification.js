document.addEventListener('DOMContentLoaded', () => {

    const NotificationTable = $('#NotificationTable').DataTable({
        responsive: true
    });

    NotificationTable.on('init.dt', function () {
        $('.dataTables_filter').addClass('d-none');
        $('.dataTables_length').addClass('d-none');
    });

    // Delete notification
    $('#NotificationTable').on('click', '.deleteNotification', async function () {

        const notificationId = $(this).data('id');

        try {

            const response = await fetch(`/delete_notification/${notificationId}`, {
                method: 'DELETE'
            });

            if (response.ok) {

                await Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Notification deleted successfully',
                    timer: 1500
                });

                location.reload();

            } else {

                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to delete notification'
                });

            }

        } catch (error) {

            console.error(error);

        }

    });

    // Toggle status
    $('#NotificationTable').on('click', '.toggleStatus', async function () {

        const notificationId = $(this).data('id');
        const currentStatus = $(this).data('status');
        const newStatus = currentStatus === 1 ? 0 : 1;

        try {

            const response = await fetch(`/changestatus_notification/${notificationId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {

                await Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: `Notification ${newStatus === 1 ? 'activated' : 'deactivated'}`,
                    timer: 1500
                });

                location.reload();

            } else {

                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Status change failed'
                });

            }

        } catch (error) {

            console.error(error);

        }

    });

});