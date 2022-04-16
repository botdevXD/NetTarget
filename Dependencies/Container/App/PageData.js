class Data{
    Pages = {
        ["/"]: {
            page_file: "home.html",
            methods: {
                GET: true
            },
            rate_limit: false,
        },
    
        ["/api/attack"]: {
            page_file: null,
            methods: {
                POST: true
            },
            rate_limit: true,
        }
    }
}

module.exports = new Data