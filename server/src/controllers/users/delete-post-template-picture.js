const fs = require('fs');
const path = require('path');

const User = require('../../models/User');

const {
  generateError,
  success,
  asyncErrorHandler,
} = require('../../utils/utils');
const consts = require('../../const/const');

exports.deletePostTemplatePicture = asyncErrorHandler(
  async (req, res, next) => {
    const { login } = req.params;
    const { hash } = req.params;

    if (req.session.userLogin !== login) {
      generateError('Can delete image only for yourself', 403, next);
      return;
    }
    if (!hash) {
      generateError('Hash is required for this operation', 422, next);
      return;
    }

    const userTemplate = await User.findById(req.session.userId).select(
      'template',
    );

    const foundSection = userTemplate.template.sections.find(
      (sec) => sec.hash === hash,
    );

    userTemplate.template.sections.indexOf(foundSection);

    if (foundSection) {
      if (
        foundSection.type === consts.POST_SECTION_TYPES.PICTURE &&
        foundSection.isFile === true
      ) {
        const { url } = foundSection;

        // async function removeSection() {
        //   await User.findByIdAndUpdate(req.session.userId, {
        //     $pull: {
        //       'template.sections': foundSection,
        //     },
        //   });
        // }

        const delCb = (err) => {
          if (err) generateError(err, 500, next);
          else success(req, res);
        };

        const absolutePath = path.join(process.cwd(), url);

        fs.access(absolutePath, (accessErr) => {
          if (!accessErr) {
            fs.unlink(absolutePath, (err) => {
              if (err) {
                generateError(err, 500, next);
              } else {
                userTemplate.deleteSection(foundSection, delCb);
              }
            });

            return;
          }

          userTemplate.deleteSection(foundSection, delCb);
        });
      } else {
        generateError(
          'This operation cannot be done for not file picture sections or not pictures',
        );
      }
    } else {
      generateError('Section with given hash is not found', 404, next);
    }
  },
);
