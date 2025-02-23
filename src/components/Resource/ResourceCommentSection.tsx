import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { t } from "i18next";
import { useQueryParams } from "raviger";
import { useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/ui/markdown";
import { Textarea } from "@/components/ui/textarea";
import { TooltipComponent } from "@/components/ui/tooltip";

import { Avatar } from "@/components/Common/Avatar";
import PaginationComponent from "@/components/Common/Pagination";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { formatDateTime, formatName, relativeTime } from "@/Utils/utils";
import { CommentModel } from "@/types/resourceRequest/resourceRequest";

const CommentSection = (props: { id: string }) => {
  const { id } = props;
  const [commentBox, setCommentBox] = useState("");
  const queryClient = useQueryClient();

  const [qParams, setQueryParams] = useQueryParams<{ page?: number }>();

  const { data: resourceComments, isLoading } = useQuery({
    queryKey: ["resourceComments", id, qParams],
    queryFn: query(routes.getResourceComments, {
      queryParams: {
        limit: RESULTS_PER_PAGE_LIMIT,
        offset: ((qParams.page ?? 1) - 1) * RESULTS_PER_PAGE_LIMIT,
      },
      pathParams: { id },
    }),
  });

  const { mutate: addComment } = useMutation({
    mutationFn: mutate(routes.addResourceComments, {
      pathParams: { id },
    }),
    onSuccess: () => {
      toast.success(t("comment_added_successfully"));
      queryClient.invalidateQueries({ queryKey: ["resourceComments", id] });
    },
  });

  const submitComment = () => {
    if (!/\S+/.test(commentBox)) {
      toast.error(t("comment_min_length"));
      return;
    }
    addComment({
      comment: commentBox,
    });
    setCommentBox("");
  };

  return (
    <div className="flex w-full flex-col">
      <div>
        <Textarea
          name="comment"
          placeholder={t("type_your_comment")}
          value={commentBox}
          onChange={(e) => setCommentBox(e.target.value)}
        />

        <div className="flex w-full justify-end mt-2">
          <Button variant="primary" onClick={submitComment}>
            {t("post_your_comment")}
          </Button>
        </div>

        <div className="w-full">
          {isLoading ? (
            <div>
              <div className="grid gap-5">
                <CardListSkeleton count={RESULTS_PER_PAGE_LIMIT} />
              </div>
            </div>
          ) : (
            <div>
              {resourceComments?.results?.length === 0 ? (
                <div className="p-flex w-full justify-center border-b border-secondary-200 bg-white p-5 text-center text-2xl font-bold text-secondary-500">
                  <span>{t("no_comments_available")}</span>
                </div>
              ) : (
                <ul>
                  {resourceComments?.results
                    ? [...resourceComments.results].reverse().map((comment) => (
                        <li key={comment.id} className="w-full">
                          <Comment {...comment} />
                        </li>
                      ))
                    : null}
                  <div className="flex w-full items-center justify-center">
                    <div
                      className={cn(
                        "flex w-full justify-center",
                        (resourceComments?.count ?? 0) > RESULTS_PER_PAGE_LIMIT
                          ? "visible"
                          : "invisible",
                      )}
                    >
                      <PaginationComponent
                        cPage={qParams.page ?? 1}
                        defaultPerPage={RESULTS_PER_PAGE_LIMIT}
                        data={{ totalCount: resourceComments?.count ?? 0 }}
                        onChange={(page) => setQueryParams({ page })}
                      />
                    </div>
                  </div>
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentSection;

export const Comment = ({
  comment,
  created_by,
  created_date,
}: CommentModel) => (
  <div
    className={cn(
      "mt-4 flex w-full flex-col rounded-lg border border-secondary-300 bg-white p-4 text-secondary-800",
    )}
  >
    <div className="flex items-start gap-3">
      <TooltipComponent content={formatName(created_by)}>
        <div className="flex">
          <Avatar
            name={`${created_by.first_name} ${created_by.last_name}`}
            className="w-8 h-8 rounded-full object-cover"
          />
        </div>
      </TooltipComponent>
      <div className="flex flex-col flex-grow mt-1">
        <div className="flex items-center justify-between w-full">
          <span className="text-gray-700 font-medium text-xs md:text-sm">
            {formatName(created_by)}
          </span>
          <time
            className="text-gray-500 text-xs"
            dateTime={created_date}
            title={formatDateTime(created_date)}
          >
            {relativeTime(created_date)}
          </time>
        </div>
        <div className="break-words whitespace-pre-wrap mt-1">
          <Markdown content={comment} />
        </div>
      </div>
    </div>
  </div>
);
