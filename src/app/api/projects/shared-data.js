// Shared data store for both scrum-board and tasks API routes
let modifiedScrumboardData = null;

export const getSharedData = () => {
    return modifiedScrumboardData;
};

export const setSharedData = (data) => {
    modifiedScrumboardData = data;
    console.log('Shared data updated:', data);
}; 