import ApiService from './ApiService'

// Obtém a função fetchDataWithAxios do objeto ApiService
const fetchDataWithAxios = ApiService.fetchDataWithAxios

const ProjectDataService = {
    /**
     * Obtém os dados do scrumboard
     * @returns {Promise} Promise com os dados do scrumboard
     */
    getScrumboardData: () => {
        return fetchDataWithAxios({
            url: '/projects/scrum-board',
            method: 'get'
        })
    },

    /**
     * Salva os dados do scrumboard
     * @param {Object} data - Dados do scrumboard para salvar
     * @returns {Promise} Promise com o resultado da operação
     */
    saveScrumboardData: (data) => {
        return fetchDataWithAxios({
            url: '/projects/scrum-board',
            method: 'post',
            data
        })
    },

    /**
     * Obtém os dados das tasks
     * @returns {Promise} Promise com os dados das tasks
     */
    getTasksData: () => {
        return fetchDataWithAxios({
            url: '/projects/tasks',
            method: 'get'
        })
    },

    /**
     * Salva os dados das tasks
     * @param {Object} data - Dados das tasks para salvar
     * @returns {Promise} Promise com o resultado da operação
     */
    saveTasksData: (data) => {
        return fetchDataWithAxios({
            url: '/projects/tasks',
            method: 'post',
            data
        })
    }
}

export default ProjectDataService