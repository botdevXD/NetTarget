class Data{
    Pages = {
        ["/"]: {
            page_file: "home.html",
            methods: {
                GET: true
            }
        },
    
        ["/api/attack"]: {
            page_file: null,
            methods: {
                POST: true
            }
        }
    }
}

module.exports = new Data