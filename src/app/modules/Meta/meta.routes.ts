import express from 'express';
import { MetaController } from './meta.controller';

const router = express.Router();
import { checkAuth } from '../../middleware/checkAuth';
import { Role } from '../../../generated/prisma/enums';

router.get(
    '/',
    checkAuth(Role.MEMBER, Role.ADMIN),
    MetaController.fetchDashboardMetaData
);

export const MetaRoutes = router;