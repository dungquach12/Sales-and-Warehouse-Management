export function showLoadingState(isLoading, containerId) {
    // Show spinner or skeleton screen
    const container = document.getElementById(containerId);
    if (container && isLoading) {
        container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-secondary"></div> <br> <small>Đang tải...</small> </div>';
    }
}