import { HeaderResolver, I18nModule, I18nOptions } from "nestjs-i18n";
import path from "path";

const i18nModuleConfig = () => {
    const options: I18nOptions = {
        fallbackLanguage: 'es',
        loaderOptions: {
            path: path.join(__dirname, '../../../src/i18n'),
            watch: true,
        },
        resolvers: [{
            use: HeaderResolver, options: ['lang']
        }]
    };

    // return i18nModule.forRoot(options);
    return I18nModule.forRoot(options);
}

export default i18nModuleConfig;