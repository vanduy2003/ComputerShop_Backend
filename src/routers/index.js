import categoryRouter from "./categoryRouter.js";
import loginRouter from "./loginRouter.js";
import productRouter from "./productRouter.js";
import brandRouter from "./brandRouter.js";
import newRouter from "./newRouter.js";
import orderRouter from "./orderRoutes.js";

const appCpmputer = (app) => {
    app.use(orderRouter);
    app.use(newRouter);
    app.use(brandRouter);
    app.use(productRouter);
    app.use(categoryRouter);
    app.use(loginRouter);
};
export default appCpmputer;
