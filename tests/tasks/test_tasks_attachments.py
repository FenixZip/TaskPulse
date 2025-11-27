"""tasks/tests/test_tasks_attachments.py"""

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from tasks.models import TaskAttachment


@pytest.mark.django_db
def test_upload_attachment_creates_record_and_returns_url(
    auth_client, task_factory, sample_file, media_tmpdir
):
    """
    Цель: POST /api/tasks/{id}/attachments/ должен:
    - создать запись TaskAttachment,
    - сохранить файл в MEDIA_ROOT,
    - вернуть поле file_url, которое открывается (в dev — /media/...).
    """

    task = task_factory()
    # упакуем in-memory файл как загрузку формы
    up = SimpleUploadedFile(
        sample_file.name, sample_file.read(), content_type="text/plain"
    )
    r = auth_client.post(
        f"/api/tasks/{task.id}/attachments/",
        data={"file": up},
        format="multipart",
    )
    assert r.status_code == 201, r.content
    # должна создаться запись вложения, файл лежать в media, а url присутствовать
    assert TaskAttachment.objects.filter(task=task).count() == 1
    assert r.data.get("file_url"), "ожидали получить file_url в ответе"
